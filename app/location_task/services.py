from sqlalchemy.orm import Session
from uuid import UUID
from app.location_task import schemas, selectors
from app.location_task.models import LocationTask


def create_location_task(db: Session, payload: schemas.LocationTaskCreate) -> LocationTask:
    obj = LocationTask(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_location_task(db: Session, task_id: UUID, payload: schemas.LocationTaskUpdate) -> LocationTask:
    obj = selectors.get_location_task(db, task_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_location_task(db: Session, task_id: UUID) -> None:
    obj = selectors.get_location_task(db, task_id)
    if obj:
        db.delete(obj)
        db.commit()