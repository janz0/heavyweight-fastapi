from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor_baseline import schemas, selectors
from app.monitoring_sensor_baseline.models import MonitoringSensorBaseline


def create_monitoring_sensor_baseline(db: Session, payload: schemas.MonitoringSensorBaselineCreate) -> MonitoringSensorBaseline:
    obj = MonitoringSensorBaseline(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_monitoring_sensor_baseline(db: Session, baseline_id: UUID, payload: schemas.MonitoringSensorBaselineUpdate) -> MonitoringSensorBaseline:
    obj = selectors.get_monitoring_sensor_baseline(db, baseline_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_monitoring_sensor_baseline(db: Session, baseline_id: UUID) -> None:
    obj = selectors.get_monitoring_sensor_baseline(db, baseline_id)
    if obj:
        db.delete(obj)
        db.commit()