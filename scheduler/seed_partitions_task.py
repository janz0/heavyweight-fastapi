#!/usr/bin/env python3
"""
Upsert a scheduler task that calls the DB routine via app.jobs:create_upcoming_mon_sensor_data_partitions

Usage:
  # install deps in your venv (same as db_setup.py):
  #   pip install SQLAlchemy psycopg2-binary python-dotenv
  #
  # env:
  #   set DATABASE_URL=postgres://user:pass@host:5432/dbname   (Windows)
  #   export DATABASE_URL=postgres://user:pass@host:5432/dbname (macOS/Linux)
  #
  # run (daily default):
  #   python seed_partitions_task.py
  #
  # run monthly (~30 days) and make it due now:
  #   python seed_partitions_task.py --monthly --run-now
"""
from __future__ import annotations
import os, sys, argparse
from sqlalchemy import create_engine, text

# Optional: load .env in same folder
try:
    from dotenv import load_dotenv  # pip install python-dotenv
    load_dotenv()
except Exception:
    pass

def norm_psycopg2(url: str) -> str:
    # Match your db_setup.py behavior (psycopg2)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

def main() -> int:
    ap = argparse.ArgumentParser(description="Seed scheduler task for create_upcoming_mon_sensor_data_partitions")
    ap.add_argument("--name", default="create-partitions", help="Task name (unique)")
    ap.add_argument("--interval", type=int, default=86400, help="Interval seconds (default: 86400 = daily)")
    ap.add_argument("--monthly", action="store_true", help="Set interval to ~monthly (30 days = 2,592,000s)")
    ap.add_argument("--enabled", type=int, default=1, choices=[0,1], help="Enabled flag (0/1)")
    ap.add_argument("--run-now", action="store_true", help="Set next_run_at = now() so it runs ASAP")
    args = ap.parse_args()

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: Set DATABASE_URL env var.", file=sys.stderr)
        return 2

    interval = 2_592_000 if args.monthly else args.interval  # ~30 days if --monthly

    engine = create_engine(norm_psycopg2(db_url), future=True)

    # Ensure the table exists
    with engine.connect() as conn:
        exists = conn.execute(text("""
            SELECT EXISTS (
              SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name='scheduler_tasks'
            )
        """)).scalar()
        if not exists:
            print("ERROR: public.scheduler_tasks does not exist. Run db_setup.py first.", file=sys.stderr)
            return 3

    func_path = "app.jobs:create_upcoming_mon_sensor_data_partitions"

    # Upsert by name; if --run-now is set, update next_run_at to now()
    sql = text("""
        INSERT INTO public.scheduler_tasks
          (name, func_path, args_json, kwargs_json, interval_seconds, enabled, next_run_at)
        VALUES
          (:name, :func_path, '[]'::jsonb, '{}'::jsonb, :interval, :enabled, now())
        ON CONFLICT (name) DO UPDATE
        SET func_path = EXCLUDED.func_path,
            interval_seconds = EXCLUDED.interval_seconds,
            enabled = EXCLUDED.enabled,
            next_run_at = CASE
                WHEN :run_now THEN now()
                ELSE public.scheduler_tasks.next_run_at
            END,
            last_updated = now()
        RETURNING id, name, interval_seconds, enabled, next_run_at;
    """)

    with engine.begin() as conn:
        row = conn.execute(sql, {
            "name": args.name,
            "func_path": func_path,
            "interval": interval,
            "enabled": args.enabled,
            "run_now": bool(args.run_now),
        }).mappings().first()

    if row:
        print("OK:", dict(row))
    else:
        print("No change.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
