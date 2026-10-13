"""Download two pinned GGUF files and verify their SHA-256 before activation."""
import hashlib
import os
from pathlib import Path
import shutil
import sys
import time
import urllib.request

REVISION = "169f64d8b98bbaab1761e4ca3a83e6af653456cc"
FILES = {
    "VoxCPM2-BaseLM-Q8_0.gguf": (1727309920, "0113177abd11303503bf0b705e1613ec5f0a8508cc74a7dfd0f99312b962a962"),
    "VoxCPM2-Acoustic-F16.gguf": (1825096352, "5bde898488ad635ff55d24da53543768fa33d5e5cdc538ce190e5ef831038e85"),
}


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as reader:
        for chunk in iter(lambda: reader.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(destination):
    destination.mkdir(parents=True, exist_ok=True)
    for name, (size, digest) in FILES.items():
        target = destination / name
        if target.is_file() and target.stat().st_size == size and sha256(target) == digest:
            print(f"Verified cached model: {name}", flush=True)
            continue
        partial = target.with_suffix(".gguf.part")
        if partial.is_file() and partial.stat().st_size > size:
            partial.unlink()
        already = partial.stat().st_size if partial.exists() else 0
        if shutil.disk_usage(destination).free < size - already + 1024 ** 3:
            raise RuntimeError("Insufficient disk space for model download")
        for attempt in range(4):
            already = partial.stat().st_size if partial.exists() else 0
            if already == size:
                break
            headers = {"User-Agent": "ApuDa-VoxCPM-Installer/1.0"}
            if already:
                headers["Range"] = f"bytes={already}-"
            request = urllib.request.Request(f"https://huggingface.co/DennisHuang648/VoxCPM2-GGUF/resolve/{REVISION}/{name}", headers=headers)
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    append = already > 0 and response.status == 206
                    if append and not response.headers.get("Content-Range", "").startswith(f"bytes {already}-"):
                        raise RuntimeError("Invalid resumed download range")
                    with partial.open("ab" if append else "wb") as writer:
                        shutil.copyfileobj(response, writer, length=8 * 1024 * 1024)
                break
            except OSError:
                if attempt == 3:
                    raise
                time.sleep(2 * (attempt + 1))
        if partial.stat().st_size != size or sha256(partial) != digest:
            partial.unlink(missing_ok=True)
            raise RuntimeError(f"Model integrity check failed: {name}")
        partial.chmod(0o644)
        partial.replace(target)
        print(f"Downloaded and verified: {name}", flush=True)


if __name__ == "__main__":
    download(Path(sys.argv[1] if len(sys.argv) > 1 else "models"))
