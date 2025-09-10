# File: app/scheduler_task/services_run.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from datetime import datetime, timezone, timedelta
from importlib import import_module
from typing import Optional, List, Any, Dict

from app.scheduler_task.models import SchedulerTask


def _utcnow():
    return datetime.now(timezone.utc)


def _resolve_callable(func_path: str):
    if ":" not in func_path:
        raise ValueError("func_path must be 'module[:obj]' e.g. 'jobs:say_hello'")
    module_name, obj_name = func_path.split(":", 1)
    mod = import_module(module_name)
    fn = mod
    for part in obj_name.split("."):
        fn = getattr(fn, part)
    if not callable(fn):
        raise TypeError(f"Resolved object {func_path} is not callable")
    return fn


def run_task_by_id(
    db: Session,
    task_id: UUID,
    *,
    force: bool = False,
    lock_timeout_sec: int = 300,
    worker_id: Optional[str] = None,
) -> Optional[SchedulerTask]:
    """
    Atomically claim -> run -> update a single task.
    Returns the refreshed SchedulerTask, or None if not claimable/not found.
    """
    wid = worker_id or "api"

    # 1) Try to atomically claim the task (avoid double-runs)
    claim_sql = text(
        """
        UPDATE public.scheduler_tasks
        SET locked_by = :wid, locked_at = now()
        WHERE id = :tid
          AND (locked_by IS NULL OR locked_at < now() - make_interval(secs => :lock_timeout))
          AND (:force OR (enabled = 1 AND next_run_at <= now()))
        RETURNING id
        """
    )
    res = db.execute(claim_sql, {"wid": wid, "tid": str(task_id), "lock_timeout": lock_timeout_sec, "force": force}).first()
    if not res:
        db.rollback()
        return None

    # 2) Load the task row
    task: Optional[SchedulerTask] = db.query(SchedulerTask).filter(SchedulerTask.id == task_id).first()
    if not task:
        # Shouldn't happen since we just claimed it
        db.rollback()
        return None

    now = _utcnow()

    try:
        # 3) Execute the callable
        fn = _resolve_callable(task.func_path)
        args = task.args_json or []
        kwargs = task.kwargs_json or {}
        fn(*args, **kwargs)

        # 4) Success: reset retries, set next_run
        task.last_status = "ok"
        task.last_error = None
        task.retry_count = 0
        task.last_run_at = now
        task.next_run_at = now + timedelta(seconds=task.interval_seconds)
    except Exception as e:
        # 5) Failure: bump retry_count, decide next_run via backoff
        task.last_status = "error"
        # Don't let extremely long traces bloat the row
        task.last_error = str(e)[:10000]
        task.retry_count = (task.retry_count or 0) + 1
        if task.retry_count <= (task.max_retries or 0):
            delay = min(3600, int((task.backoff_seconds or 10) * (2 ** (task.retry_count - 1))))
            task.next_run_at = now + timedelta(seconds=delay)
        else:
            task.next_run_at = now + timedelta(seconds=task.interval_seconds)
            task.retry_count = 0
    finally:
        # Always release the lock
        task.locked_by = None
        task.locked_at = None
        db.commit()
        db.refresh(task)

    return task
