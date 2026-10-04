"""Single-family authentication service. Accessible only on the Docker network."""
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DATA = Path(os.environ.get('COMPASS_DATA', '/data'))
ORIGIN = os.environ.get('COMPASS_ORIGIN', 'https://future.apuda.app')
COOKIE = '__Host-compass'
LOCK = threading.RLock()
MAX_BODY = 4 * 1024 * 1024

def db():
    c = sqlite3.connect(DATA / 'compass.sqlite', timeout=20)
    c.row_factory = sqlite3.Row
    return c

def init():
    DATA.mkdir(parents=True, exist_ok=True)
    os.chmod(DATA, 0o700)
    with db() as c:
        c.executescript('''
          CREATE TABLE IF NOT EXISTS secrets (key TEXT PRIMARY KEY,value TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,role TEXT,expires REAL);
          CREATE TABLE IF NOT EXISTS attempts (role TEXT PRIMARY KEY,n INTEGER,level INTEGER,until REAL);
          CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY,revision INTEGER,payload TEXT,updated REAL);
          CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY,action TEXT,created REAL);
        ''')
        c.execute('INSERT OR IGNORE INTO secrets VALUES (?,?)', ('pepper', secrets.token_hex(32)))
    os.chmod(DATA / 'compass.sqlite', 0o600)

def value(c, key):
    r = c.execute('SELECT value FROM secrets WHERE key=?', (key,)).fetchone()
    return r[0] if r else None

def digest(c, password, salt):
    return hashlib.pbkdf2_hmac('sha256', (password + value(c, 'pepper')).encode(), bytes.fromhex(salt), 600000).hex()

def set_password(c, role, password):
    salt = secrets.token_hex(16)
    c.execute('INSERT OR REPLACE INTO secrets VALUES (?,?)', (role, salt + ':' + digest(c, password, salt)))

def valid_password(c, role, password):
    saved = value(c, role)
    if not saved:
        return False
    salt, hashed = saved.split(':')
    return hmac.compare_digest(digest(c, password, salt), hashed)

def audit(c, action):
    c.execute('INSERT INTO audit(action,created) VALUES (?,?)', (action, time.time()))
    c.execute('DELETE FROM audit WHERE id NOT IN (SELECT id FROM audit ORDER BY id DESC LIMIT 100)')

def configure(pin, password, replace=False):
    if not re.fullmatch(r'[0-9]{4}', pin) or not 12 <= len(password) <= 128:
        raise ValueError('PIN은 숫자 4자리, 보호자 비밀번호는 12~128자여야 합니다.')
    with LOCK, db() as c:
        c.execute('BEGIN IMMEDIATE')
        if value(c, 'admin') and not replace:
            raise ValueError('이미 설정되어 있습니다. 관리자 복구 명령을 사용하세요.')
        set_password(c, 'child', pin)
        set_password(c, 'admin', password)
        c.execute('DELETE FROM sessions')
        c.execute('DELETE FROM attempts')
        audit(c, 'owner_setup' if not replace else 'owner_recovery')

class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def log_message(self, *_):
        pass  # Never log credentials, cookies, bodies or child records.

    def send(self, status, data=None, headers=None):
        raw = json.dumps(data or {}, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(raw)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(raw)

    def token(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get('Cookie', ''))
            token = cookie[COOKIE].value if COOKIE in cookie else ''
        except Exception:
            token = ''
        return hashlib.sha256(token.encode()).hexdigest()

    def session(self, c):
        return c.execute('SELECT role,expires FROM sessions WHERE token=? AND expires>?', (self.token(), time.time())).fetchone()

    def do_GET(self):
        with LOCK, db() as c:
            if self.path == '/health':
                return self.send(200, {'status': 'ok', 'auth': True})
            if self.path == '/api/auth/status':
                s = self.session(c)
                return self.send(200, {'configured': bool(value(c, 'admin')), 'role': s['role'] if s else None})
            s = self.session(c)
            if self.path == '/verify':
                return self.send(200 if s else 302, headers={} if s else {'Location': '/login.html'})
            if not s:
                return self.send(401, {'error': '다시 로그인해 주세요.'})
            if self.path == '/api/auth/admin':
                if s['role'] != 'admin':
                    return self.send(403, {'error': '보호자 인증이 필요해요.'})
                return self.send(200, {'events': [dict(x) for x in c.execute('SELECT action,created FROM audit ORDER BY id DESC LIMIT 10')]})
            if self.path == '/api/study':
                r = c.execute('SELECT * FROM records WHERE id=1').fetchone()
                return self.send(200, {'revision': r['revision'] if r else 0, 'payload': json.loads(r['payload']) if r else None, 'updated': r['updated'] if r else None})
            self.send(404)

    def do_POST(self):
        # No CORS. All mutations require an exact configured HTTPS origin.
        if self.headers.get('Origin') != ORIGIN:
            return self.send(403, {'error': '이 홈페이지에서 다시 시도해 주세요.'})
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.send(415)
        try:
            size = int(self.headers.get('Content-Length', '-1'))
            if not 0 < size <= MAX_BODY:
                return self.send(413)
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError()
        except Exception:
            return self.send(400, {'error': '입력 내용을 확인해 주세요.'})
        with LOCK, db() as c:
            c.execute('BEGIN IMMEDIATE')
            if self.path == '/api/auth/login':
                return self.login(c, data)
            s = self.session(c)
            if not s:
                return self.send(401, {'error': '다시 로그인해 주세요.'})
            if self.path == '/api/auth/logout':
                c.execute('DELETE FROM sessions WHERE token=?', (self.token(),))
                return self.send(200, headers={'Set-Cookie': COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0'})
            if self.path.startswith('/api/auth/admin/'):
                if s['role'] != 'admin':
                    return self.send(403, {'error': '보호자 인증이 필요해요.'})
                if self.path == '/api/auth/admin/reset-pin':
                    pin = data.get('pin', '')
                    if not isinstance(pin, str) or not re.fullmatch(r'[0-9]{4}', pin):
                        return self.send(400, {'error': '숫자 4자리를 입력해 주세요.'})
                    set_password(c, 'child', pin)
                    c.execute("DELETE FROM attempts WHERE role='child'")
                    c.execute("DELETE FROM sessions WHERE role='child'")
                    audit(c, 'pin_reset')
                    return self.send(200, {'ok': True})
                if self.path == '/api/auth/admin/lock':
                    c.execute("DELETE FROM sessions WHERE role='child'")
                    audit(c, 'child_sessions_revoked')
                    return self.send(200, {'ok': True})
                if self.path == '/api/auth/admin/password':
                    old, new = data.get('current', ''), data.get('password', '')
                    if not isinstance(old, str) or len(old)>128 or not isinstance(new, str) or not 12 <= len(new) <= 128:
                        return self.send(400, {'error': '비밀번호는 12~128자로 입력해 주세요.'})
                    # Use the same persistent admin throttle for reauthentication.
                    if self.blocked(c, 'admin'):
                        return
                    if not valid_password(c, 'admin', old):
                        return self.failed(c, 'admin')
                    set_password(c, 'admin', new)
                    c.execute("DELETE FROM sessions WHERE role='admin'")
                    c.execute("DELETE FROM attempts WHERE role='admin'")
                    audit(c, 'admin_password_changed')
                    return self.send(200, {'ok': True})
                return self.send(404)
            if self.path == '/api/study':
                p = data.get('payload')
                if not isinstance(p, dict) or set(p) != {'core', 'extra'} or not all(isinstance(p[k], dict) for k in p) or type(data.get('revision')) is not int:
                    return self.send(400, {'error': '공부 기록 형식을 확인해 주세요.'})
                r = c.execute('SELECT revision FROM records WHERE id=1').fetchone()
                revision = r['revision'] if r else 0
                if data['revision'] != revision:
                    return self.send(409, {'error': '다른 기기에서 수정한 기록이 있어요. 먼저 비교해 주세요.'})
                now = time.time()
                c.execute('INSERT OR REPLACE INTO records VALUES (1,?,?,?)', (revision+1, json.dumps(p, ensure_ascii=False), now))
                return self.send(200, {'revision': revision+1, 'updated': now})
            self.send(404)

    def blocked(self, c, role):
        r = c.execute('SELECT * FROM attempts WHERE role=?', (role,)).fetchone()
        if r and r['until'] > time.time():
            seconds = max(1, int(r['until'] - time.time()) + 1)
            self.send(429, {'error': f'잠시 쉬었다가 {seconds//60+1}분 뒤 다시 시도해 주세요.', 'retryAfter': seconds}, {'Retry-After': str(seconds)})
            return True
        return False

    def failed(self, c, role):
        r = c.execute('SELECT * FROM attempts WHERE role=?', (role,)).fetchone()
        n, level = (r['n'], r['level']) if r else (0, 0)
        n += 1
        until = 0
        if n >= 5:
            until = time.time() + min(86400, 300 * 2**min(level, 9))
            n, level = 0, level+1
        c.execute('INSERT OR REPLACE INTO attempts VALUES (?,?,?,?)', (role,n,level,until))
        self.send(401, {'error': '번호 또는 비밀번호를 확인해 주세요.' if not until else '5회 틀렸어요. 잠시 기다린 뒤 다시 시도해 주세요.'})

    def login(self, c, data):
        if not value(c, 'admin'):
            return self.send(503, {'error': '보호자의 첫 설정을 기다리고 있어요.'})
        role, password = data.get('role'), data.get('password')
        if role not in ('child','admin') or not isinstance(password, str) or len(password)>128:
            return self.send(400)
        if self.blocked(c, role):
            return
        if not valid_password(c, role, password):
            return self.failed(c, role)
        # Retain child escalation: knowing the current PIN must not weaken future throttling.
        c.execute('UPDATE attempts SET n=0,until=0 WHERE role=?', (role,))
        c.execute('DELETE FROM sessions WHERE expires<? OR token=?', (time.time(), self.token()))
        token = secrets.token_urlsafe(32)
        remember = role == 'child' and data.get('remember') is True
        ttl = 30*86400 if remember else (900 if role=='admin' else 8*3600)
        c.execute('INSERT INTO sessions VALUES (?,?,?)', (hashlib.sha256(token.encode()).hexdigest(),role,time.time()+ttl))
        c.execute('DELETE FROM sessions WHERE token IN (SELECT token FROM sessions ORDER BY expires DESC LIMIT -1 OFFSET 100)')
        cookie = f'{COOKIE}={token}; Path=/; Secure; HttpOnly; SameSite=Strict' + (f'; Max-Age={ttl}' if remember else '')
        self.send(200, {'role': role}, {'Set-Cookie': cookie})

if __name__ == '__main__':
    init()
    ThreadingHTTPServer(('0.0.0.0', 8081), Handler).serve_forever()
