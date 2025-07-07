from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.monitoring_sensor_fields import schemas, selectors
from app.monitoring_sensor_fields.models import MonitoringSensorField
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_source import services as source_services

def create_sensor_field(db: Session, sensor_id: UUID, payload: schemas.MonitoringSensorFieldCreate) -> MonitoringSensorField:
    obj = MonitoringSensorField(sensor_id=sensor_id, **payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    sensor = db.query(MonitoringSensor).filter(MonitoringSensor.id == sensor_id).first()
    if sensor:
        # updating a sensor field changes the parent source's structure
        source_services.touch_source(db, sensor.mon_source_id)
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
