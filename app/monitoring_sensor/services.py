# File: app/monitoring_sensor/services.py

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.monitoring_sensor import schemas, selectors
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_source import services as source_services
from app.monitoring_source.models import Source
from app.location.models import Location

def create_monitoring_sensor(db: Session, payload: schemas.MonitoringSensorCreate) -> MonitoringSensor:
    obj = MonitoringSensor(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    # update the parent source timestamp since its sensors changed
    source_services.touch_source(db, obj.mon_source_id)
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

def list_sensors_for_project(
    db: Session,
    project_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          .join(Source, MonitoringSensor.mon_source_id == Source.id)
          .join(Location, Source.mon_loc_id == Location.id)
          .filter(Location.project_id == project_id)
          .order_by(MonitoringSensor.sensor_name)
          .offset(skip)
          .limit(limit)
          .all()
    )

def list_sensors_for_location(
    db: Session,
    loc_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          .join(Source, MonitoringSensor.mon_source_id == Source.id)
          .join(Location, Source.mon_loc_id == Location.id)
          .filter(Location.id == loc_id)
          .order_by(MonitoringSensor.sensor_name)
          .offset(skip)
          .limit(limit)
          .all()
    )

def get_monitoring_sensor_by_name(
    db: Session,
    sensor_name: str
) -> Optional[dict]:
    sensor = selectors.get_monitoring_sensor_by_name(db, sensor_name)
    if not sensor:
        return None
    # your existing enrich_sensor adds any extra fields you want
    return enrich_sensor(sensor)

def enrich_sensor(sensor: MonitoringSensor) -> dict:
    details = None
    if sensor.mon_source:
        details = schemas.MonitoringSensorMetadata(
            mon_source_name = sensor.mon_source.source_name
        )
    sensor_dict = dict(sensor.__dict__)
    sensor_dict["details"] = details
    model = schemas.MonitoringSensor.model_construct(**sensor_dict)
    return model
