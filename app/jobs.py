# app/jobs.py
from datetime import datetime, timezone
import time

def say_hello(name: str = "World"):
    print(f"[{datetime.now(timezone.utc).isoformat()}] Hello, {name}!")

def slow_task(seconds: int = 3):
    print(f"Starting slow task for {seconds}s...")
    time.sleep(seconds)
    print("Slow task done.")
