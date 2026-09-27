import os
from redis import Redis
from rq import Queue, Worker

redis = Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"))
queue = Queue("apuda-ai", connection=redis)

if __name__ == "__main__":
    worker = Worker([queue], connection=redis)
    worker.work(with_scheduler=False)
