from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class SchedulerTaskBase(BaseModel):
    name: str
    func_path: str
    args_json: List[Any] = Field(default_factory=list)
    kwargs_json: Dict[str, Any] = Field(default_factory=dict)
    interval_seconds: int
    enabled: Optional[int] = 1
    next_run_at: Optional[datetime] = None
    max_retries: Optional[int] = 3
    backoff_seconds: Optional[int] = 10

class SchedulerTaskCreate(SchedulerTaskBase):
    pass

class SchedulerTaskUpdate(BaseModel):
    name: Optional[str] = None
    func_path: Optional[str] = None
    args_json: Optional[List[Any]] = None
    kwargs_json: Optional[Dict[str, Any]] = None
    interval_seconds: Optional[int] = None
    enabled: Optional[int] = None
    next_run_at: Optional[datetime] = None
    max_retries: Optional[int] = None
    backoff_seconds: Optional[int] = None

class SchedulerTask(SchedulerTaskBase):
    id: UUID
    last_run_at: Optional[datetime] = None
    locked_by: Optional[str] = None
    locked_at: Optional[datetime] = None
    last_status: Optional[str] = None
    last_error: Optional[str] = None
    retry_count: int = 0
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True
