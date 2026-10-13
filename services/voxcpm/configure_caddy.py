"""Insert one /voice route, validate, and roll back if Caddy reload fails."""
from datetime import datetime, timezone
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

START = "# BEGIN APUDA VOXCPM"
END = "# END APUDA VOXCPM"
SNIPPET = """
  # BEGIN APUDA VOXCPM
  @apuda_voxcpm path /voice /voice/*
  handle @apuda_voxcpm {
    reverse_proxy 127.0.0.1:8818
  }
  # END APUDA VOXCPM
"""


def patch(text):
    if START in text or END in text:
        if text.count(START) != 1 or text.count(END) != 1:
            raise ValueError("Unexpected existing VoxCPM route markers")
        text = re.sub(r"\n[ \t]*# BEGIN APUDA VOXCPM.*?# END APUDA VOXCPM\n", "", text, count=1, flags=re.S)
    # Match a top-level site address line; nested matcher bodies cannot qualify.
    depth, quote, comment, escaped = 0, None, False, False
    candidates = []
    line_start = 0
    for index, char in enumerate(text):
        if char == "\n":
            comment = False
            line_start = index + 1
        if comment:
            continue
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char == '#':
            comment = True
        elif char in ('"', '`'):
            quote = char
        elif char == '{':
            if depth == 0:
                addresses = text[line_start:index].strip().replace(',', ' ').split()
                if any(address in ('ai.apuda.app', 'https://ai.apuda.app', 'ai.apuda.app:443') for address in addresses):
                    candidates.append(index + 1)
            depth += 1
        elif char == '}':
            depth -= 1
    if len(candidates) != 1:
        raise ValueError("Expected exactly one ai.apuda.app site block in /etc/caddy/Caddyfile")
    index = candidates[0]
    return text[:index] + SNIPPET + text[index:]


def configure(path):
    original = path.read_text()
    updated = patch(original)
    if original == updated:
        return
    stat = path.stat()
    fd, temporary = tempfile.mkstemp(prefix='.voxcpm-', suffix='.caddyfile', dir=path.parent)
    candidate = Path(temporary)
    try:
        with os.fdopen(fd, 'w') as writer:
            writer.write(updated)
        candidate.chmod(stat.st_mode & 0o777)
        os.chown(candidate, stat.st_uid, stat.st_gid)
        validation = subprocess.run(['caddy', 'validate', '--config', str(candidate), '--adapter', 'caddyfile'], capture_output=True)
        if validation.returncode:
            raise RuntimeError('Caddy candidate validation failed; existing configuration was preserved')
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        backup = path.with_name(f'Caddyfile.before-voxcpm-{stamp}.bak')
        shutil.copy2(path, backup)
        backup.chmod(0o600)
        candidate.replace(path)
        reload = subprocess.run(['caddy', 'reload', '--config', str(path), '--adapter', 'caddyfile'], capture_output=True)
        if reload.returncode:
            path.write_text(original)
            subprocess.run(['caddy', 'reload', '--config', str(path), '--adapter', 'caddyfile'], capture_output=True, check=True)
            raise RuntimeError('Caddy reload failed and was rolled back')
        print('HTTPS voice route configured; prior configuration backed up', flush=True)
    finally:
        candidate.unlink(missing_ok=True)


if __name__ == '__main__':
    configure(Path(sys.argv[1] if len(sys.argv) > 1 else '/etc/caddy/Caddyfile'))
