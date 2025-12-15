from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_group import schemas, selectors
from app.monitoring_group.models import MonitoringGroup


def create_monitoring_group(db: Session, payload: schemas.MonitoringGroupCreate) -> MonitoringGroup:
    obj = MonitoringGroup(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_monitoring_group(db: Session, group_id: UUID, payload: schemas.MonitoringGroupUpdate) -> MonitoringGroup:
    obj = selectors.get_monitoring_group(db, group_id)
    if not obj:
        return None
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_monitoring_group(db: Session, group_id: UUID) -> None:
    obj = selectors.get_monitoring_group(db, group_id)
    if obj:
        db.delete(obj)
        db.commit()