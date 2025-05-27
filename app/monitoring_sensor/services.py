from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor import schemas, selectors
from app.monitoring_sensor.models import MonitoringSensor

def create_monitoring_sensor(db: Session, payload: schemas.MonitoringSensorCreate) -> MonitoringSensor:
    obj = MonitoringSensor(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_monitoring_sensor(db: Session, sensor_id: UUID, payload: schemas.MonitoringSensorUpdate) -> MonitoringSensor:
    obj = selectors.get_monitoring_sensor(db, sensor_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_monitoring_sensor(db: Session, sensor_id: UUID) -> None:
    obj = selectors.get_monitoring_sensor(db, sensor_id)
    if obj:
        db.delete(obj)
        db.commit()