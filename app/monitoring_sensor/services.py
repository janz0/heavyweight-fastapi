# File: app/monitoring_sensor/services.py

from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session, contains_eager
from app.monitoring_sensor import schemas, selectors
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_source import services as source_services
from app.monitoring_source.models import Source
from app.location.models import Location
from app.project.models import Project

def create_monitoring_sensor(db: Session, payload: schemas.MonitoringSensorCreate) -> MonitoringSensor:
    obj = MonitoringSensor(**payload.model_dump())
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
    for k, v in payload.model_dump(exclude_unset=True).items():
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
    org_id: UUID,
    skip: int = 0,
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          .join(Source, MonitoringSensor.mon_source_id == Source.id)
          .join(Location, Source.mon_loc_id == Location.id)
          .join(Project, Location.project_id == Project.id)
          .filter(Location.project_id == project_id)
          .filter(Project.org_id == org_id)
          .order_by(MonitoringSensor.sensor_name)
          .offset(skip)
          .all()
    )

def list_sensors_for_location(
    db: Session,
    loc_id: UUID,
    org_id: UUID,
    skip: int = 0,
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          .join(MonitoringSensor.mon_source)
          .join(Source.mon_loc)
          .join(Project, Location.project_id == Project.id)
          .filter(Location.id == loc_id)
          .filter(Project.org_id == org_id)
          .options(contains_eager(MonitoringSensor.mon_source))
          .order_by(MonitoringSensor.sensor_name)
          .offset(skip)
          .all()
    )

def list_sensors_for_source(
    db: Session,
    source_id: UUID,
    org_id: UUID,
    skip: int = 0,
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
        .join(Source, MonitoringSensor.mon_source_id == Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .filter(MonitoringSensor.mon_source_id == source_id)
        .filter(Project.org_id == org_id)
        .order_by(MonitoringSensor.sensor_name)
        .offset(skip)
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
            mon_source_name=sensor.mon_source.source_name,
            group_name=getattr(sensor.mon_loc_group, "group_name", None),
        )
    sensor_dict = dict(sensor.__dict__)
    sensor_dict["details"] = details
    model = schemas.MonitoringSensor.model_construct(**sensor_dict)
    return model.model_dump()
