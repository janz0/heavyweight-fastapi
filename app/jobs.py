# app/jobs.py
from datetime import datetime, timezone
from typing import Optional, Sequence, Any, Dict
from sqlalchemy import text
import time

ALLOWED_ROUTINES: Dict[str, Dict[str, str]] = {
    # name: {kind: "procedure"|"function", schema: "public"|...}
    "create_upcoming_mon_sensor_data_partitions": {"kind": "procedure", "schema": "public"},
    # "refresh_materialized_views": {"kind": "function", "schema": "maintenance"},
}

def run_db_routine(
    name: str,
    args: Optional[Sequence[Any]] = None,
    *,
    schema: Optional[str] = None,
    kind: Optional[str] = None,         # "procedure" or "function"
    db=None,
    use_autocommit: bool = False,       # set True only if your routine does tx control inside
) -> None:
    """
    Execute a Postgres routine (function/procedure) via SQLAlchemy.
    - Pass the FastAPI SQLAlchemy Session as `db`
    - Uses bind parameters for values; the identifier (schema.name) is validated/whitelisted.
    """
    if db is None:
        raise RuntimeError("DB session required")

    meta = ALLOWED_ROUTINES.get(name, {})
    schema = schema or meta.get("schema", "public")
    kind = (kind or meta.get("kind", "function")).lower()

    # Build a parameter list like :a0, :a1, ...
    args = list(args or [])
    placeholders = ", ".join(f":a{i}" for i in range(len(args)))
    params = {f"a{i}": v for i, v in enumerate(args)}

    # Quote identifiers defensively (identifier quoting must be string-built)
    ident = f'"{schema}"."{name}"'
    if kind == "procedure":
        sql = f"CALL {ident}({placeholders})" if placeholders else f"CALL {ident}()"
    elif kind == "function":
        sql = f"SELECT {ident}({placeholders})" if placeholders else f"SELECT {ident}()"
    else:
        raise ValueError("kind must be 'procedure' or 'function'")

    if use_autocommit:
        # Only if your procedure uses COMMIT/ROLLBACK internally.
        conn = db.connection().execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(sql), params)
    else:
        db.execute(text(sql), params)

def create_upcoming_mon_sensor_data_partitions(*, db=None) -> None:
    """Nice dedicated wrapper, so your func_path is very simple."""
    return run_db_routine(
        "create_upcoming_mon_sensor_data_partitions",
        args=[],
        kind="function",
        schema="public",
        db=db,
    )

def say_hello(name: str = "World"):
    print(f"[{datetime.now(timezone.utc).isoformat()}] Hello, {name}!")

def slow_task(seconds: int = 3):
    print(f"Starting slow task for {seconds}s...")
    time.sleep(seconds)
    print("Slow task done.")
