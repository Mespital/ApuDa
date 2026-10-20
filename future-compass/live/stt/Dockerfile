# 받아쓰기 서버 (faster-whisper, CPU). 모델은 처음 실행 때 /models 에 한 번 내려받음
FROM python:3.12-slim
RUN pip install --no-cache-dir faster-whisper==1.1.1
COPY server.py /app/server.py
ENV HF_HOME=/models PYTHONUNBUFFERED=1
EXPOSE 9000
CMD ["python", "/app/server.py"]
