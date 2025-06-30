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

def enrich_sensor(sensor: MonitoringSensor) -> schemas.MonitoringSensor:
    # if you later want more related data you can load it here
    # but at minimum we can pull source.source_name into a top‐level field:
    source_name = getattr(sensor.mon_source, "source_name", None)

    # Copy the ORM attributes into a dict:
    sensor_dict = dict(sensor.__dict__)
    # Inject the extra key:
    sensor_dict["source_name"] = source_name

    # Construct a Pydantic model without re‐validating
    model = schemas.MonitoringSensor.model_construct(**sensor_dict)
    return model
