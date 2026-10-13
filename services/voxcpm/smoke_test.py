"""Run on the VPS; never emit authentication keys or input drafts."""
import array
import io
import json
from pathlib import Path
import sys
import time
import urllib.request
import wave


def main():
    base = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8818'
    key = ''
    for line in Path('.env').read_text().splitlines():
        if line.startswith('VOXCPM_API_KEY='):
            key = line.split('=', 1)[1].strip().strip('"\'')
    if not key:
        raise SystemExit('Voice API key is missing')
    def request(path, data=None):
        headers = {'X-ApuDa-AI-Key': key, 'Content-Type': 'application/json'}
        req = urllib.request.Request(base + path, data=json.dumps(data).encode() if data else None, headers=headers)
        return urllib.request.urlopen(req, timeout=20)
    with request('/voice/api/jobs', {'text': '안녕하세요, 아프다입니다.', 'voice': 'default'}) as response:
        job = json.load(response)
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        with request('/voice/api/jobs/' + job['id']) as response:
            job = json.load(response)
        if job['status'] == 'failed':
            raise SystemExit('TTS smoke test failed: ' + job['error'])
        if job['status'] == 'completed':
            break
        time.sleep(5)
    else:
        raise SystemExit('TTS smoke test exceeded 10 minutes; inspect queue and available memory')
    with request(job['audio_url']) as response:
        raw = response.read()
    with wave.open(io.BytesIO(raw), 'rb') as reader:
        assert (reader.getnchannels(), reader.getsampwidth(), reader.getframerate()) == (1, 2, 48000)
        pcm = array.array('h', reader.readframes(reader.getnframes()))
        assert len(pcm) >= 2400 and max(abs(value) for value in pcm) > 100, 'Generated audio is empty or silent'
    print(json.dumps({'voice_smoke_test': 'passed', 'job_id': job['id'], 'audio_seconds': job['duration'], 'generation_seconds': job['elapsed'], 'sample_rate': 48000}, indent=2))


if __name__ == '__main__':
    main()
