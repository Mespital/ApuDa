import base64
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import Engine, ThreadingHTTPServer, handler_class, join_wavs, split_text
from configure_caddy import patch as patch_caddy


def make_wav(path, rate=48000, seconds=0.1):
    with wave.open(str(path), 'wb') as writer:
        writer.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        writer.writeframes(b'\x10\x00' * int(rate * seconds))


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        binary = self.root / 'voxcpm2-cli'
        binary.touch()
        models = self.root / 'models'
        models.mkdir()
        for name in ('VoxCPM2-BaseLM-Q8_0.gguf', 'VoxCPM2-Acoustic-F16.gguf'):
            (models / name).touch()
        self.engine = Engine(self.root / 'data', str(binary), models, start_worker=False)
        self.http = ThreadingHTTPServer(('127.0.0.1', 0), handler_class(self.engine, 'test-secret-key-123456'))
        self.http.daemon_threads = True
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.url = f'http://127.0.0.1:{self.http.server_port}'

    def tearDown(self):
        self.http.shutdown()
        self.http.server_close()
        self.engine.db.close()
        self.temp.cleanup()

    def request(self, path, data=None, key=True):
        headers = {'Content-Type': 'application/json'}
        if key:
            headers['X-ApuDa-AI-Key'] = 'test-secret-key-123456'
        req = urllib.request.Request(self.url + path, data=json.dumps(data).encode() if data is not None else None, headers=headers)
        return urllib.request.urlopen(req)

    def test_unauthenticated_creation_and_download_are_rejected(self):
        for path, data in [('/voice/api/jobs', {'text': '안녕하세요.'}), ('/voice/api/jobs/' + 'a' * 32 + '/audio', None)]:
            with self.assertRaises(urllib.error.HTTPError) as caught:
                self.request(path, data, key=False)
            self.assertEqual(caught.exception.code, 401)

    def test_complete_job_produces_authenticated_audio(self):
        with self.request('/voice/api/jobs', {'text': '아프다입니다. 반갑습니다.', 'voice': 'default'}) as response:
            self.assertEqual(response.status, 202)
            job = json.load(response)
        with self.engine.lock:
            row = dict(self.engine.db.execute('SELECT * FROM jobs WHERE id=?', (job['id'],)).fetchone())
        commands = []
        def fake_run(command, **options):
            self.assertNotIn('shell', options)
            commands.append(command)
            make_wav(Path(command[command.index('-o') + 1]))
        with patch('server.subprocess.run', fake_run):
            self.engine.synthesize(row)
        with self.request('/voice/api/jobs/' + job['id']) as response:
            result = json.load(response)
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(result['completed'], 2)
        self.assertAlmostEqual(result['duration'], 0.4)
        self.assertTrue(all('--cpu' in command for command in commands))
        with self.request(result['audio_url']) as response:
            self.assertEqual(response.headers.get_content_type(), 'audio/wav')
            with wave.open(io.BytesIO(response.read()), 'rb') as reader:
                self.assertEqual(reader.getframerate(), 48000)
        self.assertEqual(self.engine.db.execute('SELECT text FROM jobs').fetchone()[0], '')

    def test_queue_is_bounded_and_invalid_text_rejected(self):
        for _ in range(3):
            self.engine.create('안녕하세요.', 'default')
        with self.assertRaises(OverflowError):
            self.engine.create('추가 작업.', 'default')
        for text in ['', '가' * 801, '안녕\x00']:
            with self.assertRaises(ValueError):
                self.engine.create(text, 'default')

    def test_failed_subprocess_is_reported_without_draft(self):
        import subprocess
        job = self.engine.create('비공개 원고.', 'default')
        row = dict(self.engine.db.execute('SELECT * FROM jobs WHERE id=?', (job['id'],)).fetchone())
        with patch('server.subprocess.run', side_effect=subprocess.CalledProcessError(137, 'binary')):
            self.engine.synthesize(row)
        self.assertEqual(self.engine.get(job['id'])['status'], 'failed')
        self.assertEqual(self.engine.db.execute('SELECT text FROM jobs').fetchone()[0], '')

    def test_voice_reference_validates_format(self):
        reference = self.root / 'reference.wav'
        make_wav(reference, 16000, 3)
        identifier = self.engine.save_reference(base64.b64encode(reference.read_bytes()).decode())
        self.assertTrue((self.engine.directory / 'references' / (identifier + '.wav')).is_file())
        make_wav(reference, 48000, 3)
        with self.assertRaises(ValueError):
            self.engine.save_reference(base64.b64encode(reference.read_bytes()).decode())

    def test_number_and_medical_marker_are_preserved(self):
        text = '용량은 1.5 mg입니다. HER2 검사 결과를 확인합니다.'
        self.assertEqual(split_text(text), ['용량은 1.5 mg입니다.', 'HER2 검사 결과를 확인합니다.'])
        self.assertTrue(all(len(part) <= 80 for part in split_text('가' * 241)))


class CaddyTests(unittest.TestCase):
    def test_patch_preserves_existing_hosts_and_is_idempotent(self):
        original = 'other.apuda.app {\n reverse_proxy 9000\n}\nai.apuda.app {\n reverse_proxy 127.0.0.1:8000\n}\n'
        result = patch_caddy(original)
        self.assertIn('reverse_proxy 127.0.0.1:8000', result)
        self.assertIn('other.apuda.app {\n reverse_proxy 9000\n}', result)
        self.assertEqual(patch_caddy(result), result)

    def test_unrecognized_config_does_not_generate_replacement(self):
        with self.assertRaises(ValueError):
            patch_caddy('import sites/*.caddy\n')


if __name__ == '__main__':
    unittest.main()
