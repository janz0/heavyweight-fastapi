from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.scheduler_task.models import SchedulerTask

def get_task(db: Session, task_id: UUID) -> Optional[SchedulerTask]:
    return db.query(SchedulerTask).filter(SchedulerTask.id == task_id).first()

def get_task_by_name(db: Session, name: str) -> Optional[SchedulerTask]:
    return db.query(SchedulerTask).filter(SchedulerTask.name == name).first()

def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    enabled: Optional[int] = None,
) -> List[SchedulerTask]:
    q = db.query(SchedulerTask)
    if enabled is not None:
        q = q.filter(SchedulerTask.enabled == enabled)
    return q.order_by(SchedulerTask.next_run_at.asc()).offset(skip).limit(limit).all()
