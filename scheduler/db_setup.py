#!/usr/bin/env python3
"""
One-off helper to create the `scheduler_tasks` table (and indexes/trigger) on Postgres.
Run locally or as a temporary Railway service.

- Reads DATABASE_URL (supports postgres:// → postgresql+psycopg2:// normalization)
- Loads .env automatically if present
- Creates pgcrypto (or uuid-ossp) and uses the appropriate UUID default
- Idempotent: uses IF NOT EXISTS and safe checks
- Optional: --seed inserts an example row

Usage:
  # Local
  pip install SQLAlchemy psycopg2-binary python-dotenv
  export DATABASE_URL=postgres://user:pass@host:5432/dbname
  python db_setup.py --seed

  # Or with .env in same folder:
  #   DATABASE_URL=postgres://user:pass@host:5432/dbname
  python db_setup.py

Exit code 0 on success.
"""

from __future__ import annotations
import os
import sys
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

# --- .env support (local dev) ---
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

import argparse


def normalize_db_url(url: str) -> str:
    # Map provider style URL to SQLAlchemy
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def get_engine() -> Engine:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL is not set.", file=sys.stderr)
        sys.exit(2)
    url = normalize_db_url(db_url)
    return create_engine(url, pool_pre_ping=True, future=True)


def try_create_extension(conn, name: str) -> bool:
    try:
        conn.execute(text(f"CREATE EXTENSION IF NOT EXISTS {name};"))
        return True
    except Exception as e:
        print(f"WARN: failed to create extension {name}: {e}")
        return False


def pick_uuid_default(conn) -> str:
    """Ensure a UUID extension exists and return the default function call string."""
    # Prefer pgcrypto → gen_random_uuid()
    if try_create_extension(conn, "pgcrypto"):
        return "gen_random_uuid()"
    # Fallback to uuid-ossp → uuid_generate_v4()
    if try_create_extension(conn, '"uuid-ossp"'):
        return "uuid_generate_v4()"
    # Last resort: no default; user must supply UUID in app layer
    print("WARN: neither pgcrypto nor uuid-ossp available; creating table without UUID default.")
    return ""  # caller will omit DEFAULT


def create_table(conn, uuid_default: str) -> None:
    default_clause = f" DEFAULT {uuid_default}" if uuid_default else ""
    ddl = f"""
    CREATE TABLE IF NOT EXISTS public.scheduler_tasks (
      id                uuid PRIMARY KEY{default_clause},
      name              text NOT NULL UNIQUE,
      func_path         text NOT NULL,
      args_json         jsonb NOT NULL DEFAULT '[]'::jsonb,
      kwargs_json       jsonb NOT NULL DEFAULT '{{}}'::jsonb,
      interval_seconds  integer NOT NULL,
      last_run_at       timestamptz,
      next_run_at       timestamptz NOT NULL DEFAULT now(),
      enabled           integer NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
      locked_by         text,
      locked_at         timestamptz,
      last_status       text,
      last_error        text,
      retry_count       integer NOT NULL DEFAULT 0,
      max_retries       integer NOT NULL DEFAULT 3,
      backoff_seconds   integer NOT NULL DEFAULT 10,
      created_at        timestamptz NOT NULL DEFAULT now(),
      last_updated      timestamptz NOT NULL DEFAULT now()
    );
    """
    conn.execute(text(ddl))


def create_indexes(conn) -> None:
    conn.execute(text(
        """
        CREATE INDEX IF NOT EXISTS idx_scheduler_tasks_due
          ON public.scheduler_tasks (next_run_at)
          WHERE enabled = 1;
        """
    ))
    conn.execute(text(
        """
        CREATE INDEX IF NOT EXISTS idx_scheduler_tasks_name
          ON public.scheduler_tasks (name);
        """
    ))


def create_touch_trigger(conn) -> None:
    conn.execute(text(
        """
        CREATE OR REPLACE FUNCTION touch_last_updated()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.last_updated := now();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    ))
    conn.execute(text(
        """
        DROP TRIGGER IF EXISTS trg_touch_last_updated ON public.scheduler_tasks;
        CREATE TRIGGER trg_touch_last_updated
        BEFORE UPDATE ON public.scheduler_tasks
        FOR EACH ROW EXECUTE FUNCTION touch_last_updated();
        """
    ))


def seed_example(conn) -> None:
    conn.execute(text(
        """
        INSERT INTO public.scheduler_tasks (name, func_path, interval_seconds, next_run_at)
        VALUES ('say-hello', 'jobs:say_hello', 60, now())
        ON CONFLICT (name) DO NOTHING;
        """
    ))


def verify(conn) -> None:
    rows = conn.execute(text(
        "SELECT id, name, enabled, next_run_at FROM public.scheduler_tasks ORDER BY next_run_at LIMIT 5;"
    )).mappings().all()
    print("OK: scheduler_tasks present. Sample:")
    for r in rows:
        print(dict(r))


def main(seed: bool = False) -> int:
    engine = get_engine()
    with engine.begin() as conn:  # begin() gives us a transaction
        uuid_default = pick_uuid_default(conn)
        create_table(conn, uuid_default)
        create_indexes(conn)
        create_touch_trigger(conn)
        if seed:
            seed_example(conn)
    # verify outside the transaction
    with engine.connect() as conn:
        verify(conn)
    print("Done.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Create scheduler_tasks table on Postgres")
    ap.add_argument("--seed", action="store_true", help="Insert example task 'say-hello'")
    args = ap.parse_args()
    sys.exit(main(seed=args.seed))
