#!/usr/bin/env python3
from __future__ import annotations
import os, time, logging, argparse
from typing import Optional, List
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# .env (local)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

try:
    import httpx
except Exception:
    httpx = None

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"),
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("scheduler-worker")

def normalize_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

def get_env(name: str, default: Optional[str] = None) -> str:
    val = os.getenv(name, default)
    if val is None:
        raise RuntimeError(f"Missing required env var: {name}")
    return val

def make_engine(db_url: str) -> Engine:
    return create_engine(normalize_db_url(db_url), pool_pre_ping=True, future=True)

def probe_connection(engine: Engine) -> None:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    log.info("DB connectivity OK (SELECT 1)")

def table_exists(engine: Engine, table_name: str) -> bool:
    q = text("""
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema='public' AND table_name=:tname
        );
    """)
    with engine.connect() as conn:
        return bool(conn.execute(q, {"tname": table_name}).scalar())

def fetch_due_tasks(engine: Engine, limit: int = 20) -> List[dict]:
    if not table_exists(engine, "scheduler_tasks"):
        log.warning("Table 'scheduler_tasks' not found yet. Skipping read.")
        return []
    sql = text("""
        SELECT id, name, enabled, func_path, next_run_at
        FROM scheduler_tasks
        WHERE enabled = 1 AND next_run_at <= now()
        ORDER BY next_run_at ASC
        LIMIT :limit
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql, {"limit": limit}).mappings().all()
        return [dict(r) for r in rows]

def trigger_task_run(task_id: str) -> None:
    base = os.getenv("API_BASE_URL")
    token = os.getenv("API_TOKEN")     # optional bearer token
    if not base:
        log.debug("API_BASE_URL not set; skipping trigger.")
        return
    if httpx is None:
        log.warning("httpx not installed; cannot call the API. 'pip install httpx'.")
        return

    url = f"{base.rstrip('/')}/tasks/{task_id}/run"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = httpx.post(url, headers=headers, timeout=30)
        if r.status_code == 409:
            log.info("Task %s not claimable (409). Another runner probably won. Skipping.", task_id)
            return
        r.raise_for_status()
        log.info("Triggered task %s -> %s", task_id, r.status_code)
    except Exception as e:
        log.exception("Failed to trigger task %s: %s", task_id, e)

def run(interval_seconds: int) -> None:
    engine = make_engine(get_env("DATABASE_URL"))
    log.info("Starting worker. interval=%ss", interval_seconds)
    due_limit = int(os.getenv("DUE_LIMIT", "10"))

    while True:
        try:
            probe_connection(engine)
            due = fetch_due_tasks(engine, limit=due_limit)
            if due:
                log.info("%d task(s) due. Triggering...", len(due))
                for t in due:
                    trigger_task_run(str(t["id"]))
            else:
                log.info("No due tasks right now.")
        except Exception as e:
            log.exception("Worker iteration error: %s", e)
        finally:
            time.sleep(interval_seconds)

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Background scheduler worker")
    p.add_argument("--interval", type=int, default=int(os.getenv("POLL_INTERVAL_SECONDS", "3600")),
                   help="Polling interval in seconds (default env POLL_INTERVAL_SECONDS or 3600)")
    return p.parse_args()

if __name__ == "__main__":
    args = parse_args()
    run(args.interval)
