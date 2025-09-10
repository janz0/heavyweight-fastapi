from sqlalchemy import Column, Text, Integer, DateTime, text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from app.config.database import DBBase

class SchedulerTask(DBBase):
    __tablename__ = "scheduler_tasks"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))

    # human-readable name (unique), e.g. "say-hello"
    name = Column(Text, nullable=False, unique=True)

    # dotted path for the callable (e.g., "jobs:say_hello")
    func_path = Column(Text, nullable=False)

    # arguments to pass to the callable at run-time
    args_json = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    kwargs_json = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # scheduling & execution bookkeeping
    interval_seconds = Column(Integer, nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # use 1/0 like your other tables
    enabled = Column(Integer, nullable=False, server_default=text("1"))

    # soft locking fields (for workers)
    locked_by = Column(Text, nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)

    last_status = Column(Text, nullable=True)  # "ok" | "error" | "skipped"
    last_error = Column(Text, nullable=True)

    retry_count = Column(Integer, nullable=False, server_default=text("0"))
    max_retries = Column(Integer, nullable=False, server_default=text("3"))
    backoff_seconds = Column(Integer, nullable=False, server_default=text("10"))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
