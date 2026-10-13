"""Single-user, bounded CPU TTS queue. The model lives only in child processes."""
from __future__ import annotations

import base64
import hmac
import io
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import threading
import time
import uuid
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
VOICES = {
    "default": "",
    "calm_male": "(A calm adult male voice, clear pronunciation, measured pace)",
    "warm_female": "(A warm adult female voice, clear pronunciation, measured pace)",
}
IDENTIFIER = re.compile(r"^[0-9a-f]{32}$")
MAX_TEXT = 800
MAX_BODY = 1_000_000
MAX_QUEUE = 3
RETENTION = 7 * 86400


def split_text(text: str, limit: int = 80) -> list[str]:
    result = []
    for sentence in re.split(r"(?<=[.!?。！？])\s+|\n+", text.strip()):
        sentence = sentence.strip()
        while len(sentence) > limit:
            cut = sentence.rfind(" ", limit // 2, limit + 1)
            if cut < 0:
                cut = limit
            result.append(sentence[:cut].strip())
            sentence = sentence[cut:].strip()
        if sentence:
            result.append(sentence)
    return result


def wav_info(path: Path) -> dict:
    with wave.open(str(path), "rb") as reader:
        if reader.getnchannels() != 1 or reader.getsampwidth() != 2 or reader.getframerate() != 48000:
            raise ValueError("Expected 48 kHz mono PCM16 audio")
        if reader.getnframes() < 2400:
            raise ValueError("Generated audio is empty")
        return {"sample_rate": 48000, "duration_seconds": round(reader.getnframes() / 48000, 2)}


def join_wavs(parts: list[Path], output: Path) -> dict:
    temporary = output.with_suffix(".tmp.wav")
    with wave.open(str(temporary), "wb") as writer:
        writer.setparams((1, 2, 48000, 0, "NONE", "not compressed"))
        for index, path in enumerate(parts):
            wav_info(path)
            with wave.open(str(path), "rb") as reader:
                writer.writeframes(reader.readframes(reader.getnframes()))
            if index < len(parts) - 1:
                writer.writeframes(b"\x00\x00" * 9600)
    temporary.replace(output)
    return wav_info(output)


class Engine:
    def __init__(self, directory: Path, binary: str, models: Path, start_worker: bool = True):
        self.directory = directory
        self.binary = binary
        self.models = models
        self.lock = threading.RLock()
        self.wake = threading.Event()
        self.stop = threading.Event()
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "references").mkdir(exist_ok=True)
        self.db = sqlite3.connect(directory / "jobs.sqlite3", check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("""CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY, created REAL, updated REAL, status TEXT,
            text TEXT, voice TEXT, reference TEXT, completed INTEGER, total INTEGER,
            elapsed REAL, duration REAL, error TEXT)""")
        self.db.execute("UPDATE jobs SET status='failed', text='', error='서버 재시작으로 작업이 중단되었습니다.' WHERE status='running'")
        self.db.commit()
        self.thread = None
        if start_worker:
            self.thread = threading.Thread(target=self.worker, daemon=True)
            self.thread.start()

    def ready(self) -> bool:
        return Path(self.binary).is_file() and all((self.models / name).is_file() for name in (
            "VoxCPM2-BaseLM-Q8_0.gguf", "VoxCPM2-Acoustic-F16.gguf"))

    def update(self, identifier: str, **changes):
        with self.lock:
            changes["updated"] = time.time()
            names = ", ".join(f"{name}=?" for name in changes)
            self.db.execute(f"UPDATE jobs SET {names} WHERE id=?", [*changes.values(), identifier])
            self.db.commit()

    def create(self, text: str, voice: str, reference: str | None = None) -> dict:
        if not isinstance(text, str) or not 1 <= len(text.strip()) <= MAX_TEXT:
            raise ValueError(f"원고는 1~{MAX_TEXT}자로 입력해 주세요.")
        if "\x00" in text or any(ord(c) < 32 and c not in "\n\r\t" for c in text):
            raise ValueError("원고에 사용할 수 없는 문자가 있습니다.")
        if voice not in VOICES:
            raise ValueError("목소리를 선택해 주세요.")
        if reference and (not IDENTIFIER.fullmatch(reference) or not (self.directory / "references" / f"{reference}.wav").is_file()):
            raise ValueError("등록된 목소리 샘플을 찾을 수 없습니다.")
        segments = split_text(text)
        with self.lock:
            count = self.db.execute("SELECT COUNT(*) FROM jobs WHERE status IN ('queued','waiting_memory','running')").fetchone()[0]
            if count >= MAX_QUEUE:
                raise OverflowError("대기 작업이 가득 찼습니다. 진행 중인 작업이 끝난 후 다시 시도해 주세요.")
            identifier = uuid.uuid4().hex
            now = time.time()
            self.db.execute("INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                            (identifier, now, now, "queued", text.strip(), voice, reference, 0, len(segments), 0, 0, ""))
            self.db.commit()
        self.wake.set()
        return self.get(identifier)

    def get(self, identifier: str) -> dict | None:
        if not IDENTIFIER.fullmatch(identifier):
            return None
        with self.lock:
            row = self.db.execute("SELECT * FROM jobs WHERE id=?", (identifier,)).fetchone()
            if row is None:
                return None
            public = {name: row[name] for name in ("id", "status", "completed", "total", "elapsed", "duration", "error")}
        if public["status"] == "completed":
            public["audio_url"] = f"/voice/api/jobs/{identifier}/audio"
        return public

    def memory_available(self) -> bool:
        threshold = int(os.getenv("VOXCPM_MIN_AVAILABLE_MIB", "4300")) * 1024
        try:
            lines = Path("/proc/meminfo").read_text().splitlines()
            value = next(int(line.split()[1]) for line in lines if line.startswith("MemAvailable:"))
            return value >= threshold
        except (OSError, StopIteration, ValueError):
            return False

    def cleanup(self):
        cutoff = time.time() - RETENTION
        with self.lock:
            rows = self.db.execute("SELECT id FROM jobs WHERE updated<? AND status IN ('completed','failed')", (cutoff,)).fetchall()
            for row in rows:
                shutil.rmtree(self.directory / row["id"], ignore_errors=True)
                self.db.execute("DELETE FROM jobs WHERE id=?", (row["id"],))
            self.db.commit()

    def worker(self):
        while not self.stop.is_set():
            self.cleanup()
            with self.lock:
                row = self.db.execute("SELECT * FROM jobs WHERE status IN ('queued','waiting_memory') ORDER BY created LIMIT 1").fetchone()
            if row is None:
                self.wake.wait(10)
                self.wake.clear()
                continue
            if not self.memory_available():
                self.update(row["id"], status="waiting_memory")
                self.stop.wait(10)
                continue
            self.synthesize(dict(row))

    def synthesize(self, row: dict):
        identifier = row["id"]
        folder = self.directory / identifier
        folder.mkdir(exist_ok=True)
        started = time.monotonic()
        self.update(identifier, status="running")
        try:
            parts = []
            for index, segment in enumerate(split_text(row["text"])):
                part = folder / f"part-{index:03d}.wav"
                command = [self.binary, "--cpu", "--timesteps", "10", "--steps", "200", "--seed", "42",
                           "-t", VOICES[row["voice"]] + segment, "-o", str(part)]
                if row["reference"]:
                    command += ["-r", str(self.directory / "references" / f"{row['reference']}.wav")]
                command += [str(self.models / "VoxCPM2-BaseLM-Q8_0.gguf"), str(self.models / "VoxCPM2-Acoustic-F16.gguf")]
                # The upstream CLI logs input text. Discard both streams to protect drafts.
                subprocess.run(command, check=True, timeout=900, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                wav_info(part)
                parts.append(part)
                self.update(identifier, completed=index + 1, elapsed=round(time.monotonic() - started, 1))
            info = join_wavs(parts, folder / "narration.wav")
            for part in parts:
                part.unlink()
            self.update(identifier, status="completed", duration=info["duration_seconds"], elapsed=round(time.monotonic() - started, 1), text="")
        except subprocess.TimeoutExpired:
            self.update(identifier, status="failed", error="음성 생성 제한 시간을 초과했습니다. 원고를 더 짧게 나누어 주세요.", text="")
        except (subprocess.CalledProcessError, ValueError, OSError):
            self.update(identifier, status="failed", error="음성 생성에 실패했습니다. 메모리 상태와 모델 설치를 확인해 주세요.", text="")

    def save_reference(self, encoded: str) -> str:
        try:
            raw = base64.b64decode(encoded, validate=True)
            with wave.open(io.BytesIO(raw), "rb") as reader:
                duration = reader.getnframes() / reader.getframerate()
                if (reader.getnchannels(), reader.getsampwidth(), reader.getframerate()) != (1, 2, 16000) or not 3 <= duration <= 20:
                    raise ValueError("목소리 샘플은 3~20초, 16kHz, 모노, PCM16 WAV로 준비해 주세요.")
        except (ValueError, wave.Error, EOFError, ZeroDivisionError):
            raise ValueError("목소리 샘플은 3~20초, 16kHz, 모노, PCM16 WAV로 준비해 주세요.") from None
        identifier = uuid.uuid4().hex
        (self.directory / "references" / f"{identifier}.wav").write_bytes(raw)
        return identifier


def handler_class(engine: Engine, key: str):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def setup(self):
            super().setup()
            self.connection.settimeout(15)

        def send(self, status: int, body: bytes, kind: str = "application/json", **headers):
            self.send_response(status)
            self.send_header("Content-Type", kind)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            for name, value in headers.items():
                self.send_header(name.replace("_", "-"), value)
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def json(self, status: int, payload: dict):
            self.send(status, json.dumps(payload, ensure_ascii=False).encode())

        def authorized(self) -> bool:
            provided = self.headers.get("X-ApuDa-AI-Key", "")
            if not key or not hmac.compare_digest(provided.encode(), key.encode()):
                self.json(401, {"error": "접속 코드를 확인해 주세요."})
                return False
            return True

        def do_GET(self):
            path = urlsplit(self.path).path
            if path in ("/health", "/voice/health"):
                self.json(200 if engine.ready() else 503, {"status": "ok" if engine.ready() else "not_ready", "model": "VoxCPM2", "backend": "cpu-gguf"})
                return
            if path == "/voice":
                self.send(308, b"", Location="/voice/")
                return
            if path in ("/", "/voice/"):
                self.send(200, (ROOT / "index.html").read_bytes(), "text/html; charset=utf-8", X_Frame_Options="DENY")
                return
            match = re.fullmatch(r"/voice/api/jobs/([0-9a-f]{32})(/audio)?", path)
            if not match:
                self.json(404, {"error": "찾을 수 없습니다."})
                return
            if not self.authorized():
                return
            job = engine.get(match[1])
            if job is None:
                self.json(404, {"error": "작업을 찾을 수 없습니다."})
            elif not match[2]:
                self.json(200, job)
            elif job["status"] != "completed":
                self.json(409, {"error": "음성 생성이 끝나지 않았습니다."})
            else:
                self.send(200, (engine.directory / match[1] / "narration.wav").read_bytes(), "audio/wav", Content_Disposition='attachment; filename="ApuDa-narration.wav"')

        def do_POST(self):
            if not self.authorized():
                return
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= MAX_BODY:
                    self.json(413, {"error": "입력 파일 크기를 확인해 주세요."})
                    return
                if self.headers.get_content_type() != "application/json":
                    self.json(415, {"error": "JSON 형식이 필요합니다."})
                    return
                payload = json.loads(self.rfile.read(size))
                if not isinstance(payload, dict):
                    raise ValueError("입력 내용을 확인해 주세요.")
                path = urlsplit(self.path).path
                if path == "/voice/api/jobs":
                    if not engine.ready():
                        self.json(503, {"error": "모델 설치를 확인해 주세요."})
                        return
                    self.json(202, engine.create(payload.get("text"), payload.get("voice", "default"), payload.get("reference")))
                elif path == "/voice/api/reference":
                    encoded = payload.get("wav_base64")
                    if not isinstance(encoded, str):
                        raise ValueError("목소리 샘플을 확인해 주세요.")
                    self.json(201, {"reference": engine.save_reference(encoded)})
                else:
                    self.json(404, {"error": "찾을 수 없습니다."})
            except OverflowError as error:
                self.json(429, {"error": str(error)})
            except (ValueError, TypeError, UnicodeDecodeError):
                self.json(400, {"error": "원고, 목소리 또는 파일 형식을 확인해 주세요."})
    return Handler


def main():
    key = os.environ.get("VOXCPM_API_KEY", "")
    if len(key) < 16:
        raise SystemExit("VOXCPM_API_KEY must contain at least 16 characters")
    engine = Engine(Path(os.getenv("VOXCPM_DATA", "/data")), os.getenv("VOXCPM_BINARY", "/opt/voxcpm/voxcpm2-cli"), Path(os.getenv("VOXCPM_MODELS", "/models")))
    server = ThreadingHTTPServer(("0.0.0.0", int(os.getenv("PORT", "8818"))), handler_class(engine, key))
    server.daemon_threads = True
    print("ApuDa VoxCPM CPU queue is ready", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
