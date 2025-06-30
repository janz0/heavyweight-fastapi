# File: app/monitoring_sensor/services.py

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.monitoring_sensor import schemas, selectors
from app.monitoring_sensor.models import MonitoringSensor

def create_monitoring_sensor(db: Session, payload: schemas.MonitoringSensorCreate) -> MonitoringSensor:
    obj = MonitoringSensor(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_monitoring_sensor(db: Session, sensor_id: UUID, payload: schemas.MonitoringSensorUpdate) -> Optional[MonitoringSensor]:
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

def enrich_sensor(sensor: MonitoringSensor) -> dict:
    # Build a clean dict
    sensor_dict = { 
      k: v for k, v in sensor.__dict__.items() 
      if k != "_sa_instance_state" 
    }

    # Add whatever extra you need
    sensor_dict["source_name"] = (
      sensor.mon_source.source_name if sensor.mon_source else None
    )

    # Bypass validation (you already trust your DB model)
    model = schemas.MonitoringSensor.model_construct(**sensor_dict)
    return model.model_dump()