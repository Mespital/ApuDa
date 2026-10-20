"""승준 공부방 받아쓰기 서버 — POST /asr (body=녹음 바이트, content-type=audio/*) → {"text": ...}
외부 포트 없음. 같은 docker 네트워크의 live 컨테이너만 부른다. 한 번에 하나씩 처리."""
import json, os, tempfile, threading, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

MODEL = os.environ.get('STT_MODEL', 'small')
THREADS = int(os.environ.get('STT_THREADS', '2'))
MAX = 8 * 1024 * 1024
state = {'model': None, 'error': ''}
lock = threading.Lock()

def load():
    try:
        from faster_whisper import WhisperModel
        state['model'] = WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=THREADS)
        print('model ready', MODEL, flush=True)
    except Exception as e:  # noqa: BLE001
        state['error'] = str(e)[:200]
        print('model load failed', e, flush=True)

threading.Thread(target=load, daemon=True).start()

class H(BaseHTTPRequestHandler):
    def reply(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header('content-type', 'application/json; charset=utf-8'); self.send_header('content-length', str(len(b))); self.end_headers(); self.wfile.write(b)

    def log_message(self, *a):
        pass

    def do_GET(self):
        if urlparse(self.path).path == '/health':
            return self.reply(200 if state['model'] else 503, {'ok': bool(state['model']), 'model': MODEL, 'error': state['error']})
        self.reply(404, {'error': 'not_found'})

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != '/asr':
            return self.reply(404, {'error': 'not_found'})
        if not state['model']:
            return self.reply(503, {'error': 'loading'})
        n = int(self.headers.get('content-length') or 0)
        if n <= 0 or n > MAX:
            return self.reply(413, {'error': 'size'})
        data = self.rfile.read(n)
        q = parse_qs(u.query)
        lang = (q.get('lang') or ['ko'])[0][:5]
        hint = (q.get('hint') or [''])[0][:40]
        with tempfile.NamedTemporaryFile(suffix='.audio') as f, lock:
            f.write(data); f.flush()
            t = time.time()
            try:
                segs, info = state['model'].transcribe(f.name, language=lang, beam_size=1, vad_filter=True,
                                                       initial_prompt=(hint + ' 수업 내용을 말로 정리한 녹음.') if hint else None)
                text = ' '.join(s.text.strip() for s in segs).strip()
            except Exception as e:  # noqa: BLE001
                return self.reply(422, {'error': 'decode', 'detail': str(e)[:120]})
        self.reply(200, {'text': text, 'sec': round(time.time() - t, 1), 'duration': round(getattr(info, 'duration', 0), 1)})

HTTPServer(('0.0.0.0', 9000), H).serve_forever()
