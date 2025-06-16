from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.monitoring_sensor_fields import schemas, selectors
from app.monitoring_sensor_fields.models import MonitoringSensorField

def create_sensor_field(db: Session, sensor_id: UUID, payload: schemas.MonitoringSensorFieldCreate) -> MonitoringSensorField:
    obj = MonitoringSensorField(sensor_id=sensor_id, **payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_sensor_field(db: Session, field_id: UUID, payload: schemas.MonitoringSensorFieldUpdate) -> Optional[MonitoringSensorField]:
    obj = db.query(MonitoringSensorField).filter(MonitoringSensorField.id == field_id).first()
    if not obj:
        return None
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_sensor_field(db: Session, field_id: UUID) -> None:
    obj = db.query(MonitoringSensorField).filter(MonitoringSensorField.id == field_id).first()
    if obj:
        db.delete(obj)
        db.commit()
