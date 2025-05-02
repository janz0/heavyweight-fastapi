from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.location_task.models import LocationTask


def get_location_task(db: Session, task_id: UUID) -> Optional[LocationTask]:
    return db.query(LocationTask).filter(LocationTask.id == task_id).first()


def get_location_tasks(db: Session, skip: int = 0, limit: int = 100) -> List[LocationTask]:
    return db.query(LocationTask).offset(skip).limit(limit).all()