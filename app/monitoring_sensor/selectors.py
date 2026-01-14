from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from uuid import UUID
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_source.models import Source
from app.location.models import Location
from app.project.models import Project


def source_belongs_to_org(db: Session, source_id: UUID, org_id: UUID) -> bool:
    stmt = (
        select(Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .where(Source.id == source_id)
        .where(Project.org_id == org_id)
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none() is not None


def get_monitoring_sensor_in_org(
    db: Session,
    sensor_id: UUID,
    org_id: UUID,
) -> Optional[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
        .join(Source, MonitoringSensor.mon_source_id == Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(MonitoringSensor.mon_source), joinedload(MonitoringSensor.mon_loc_group))
        .filter(MonitoringSensor.id == sensor_id)
        .filter(Project.org_id == org_id)
        .first()
    )


def get_monitoring_sensors_for_org(
    db: Session,
    org_id: UUID,
    skip: int = 0,
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
        .join(Source, MonitoringSensor.mon_source_id == Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(MonitoringSensor.mon_source), joinedload(MonitoringSensor.mon_loc_group))
        .filter(Project.org_id == org_id)
        .order_by(MonitoringSensor.sensor_name)
        .offset(skip)
        .all()
    )


def get_monitoring_sensor_by_name_in_org(
    db: Session,
    org_id: UUID,
    sensor_name: str,
) -> Optional[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
        .join(Source, MonitoringSensor.mon_source_id == Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(MonitoringSensor.mon_source), joinedload(MonitoringSensor.mon_loc_group))
        .filter(MonitoringSensor.sensor_name == sensor_name)
        .filter(Project.org_id == org_id)
        .first()
    )


def get_sensor_by_source_and_name_in_org(
    db: Session,
    org_id: UUID,
    mon_source_id: UUID,
    sensor_name: str,
) -> Optional[MonitoringSensor]:
    # Also ensures the source belongs to org via join
    return (
        db.query(MonitoringSensor)
        .join(Source, MonitoringSensor.mon_source_id == Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .filter(MonitoringSensor.mon_source_id == mon_source_id)
        .filter(MonitoringSensor.sensor_name == sensor_name)
        .filter(Project.org_id == org_id)
        .first()
    )

def get_monitoring_sensor(
    db: Session,
    sensor_id: UUID
) -> Optional[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          # load the related Source so we can read source.source_name
          .options(joinedload(MonitoringSensor.mon_source), joinedload(MonitoringSensor.mon_loc_group))
          .filter(MonitoringSensor.id == sensor_id)
          .first()
    )

def get_monitoring_sensors(
    db: Session,
    skip: int = 0,
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          # same eager-load on the list endpoint
          .options(joinedload(MonitoringSensor.mon_source), joinedload(MonitoringSensor.mon_loc_group))
          .order_by(MonitoringSensor.sensor_name)
          .offset(skip)
          .all()
    )

def get_monitoring_sensor_by_name(
    db: Session,
    sensor_name: str
) -> Optional[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          # only eager-load the source
          .options(joinedload(MonitoringSensor.mon_source), joinedload(MonitoringSensor.mon_loc_group))
          .filter(MonitoringSensor.sensor_name == sensor_name)
          .first()
    )

def get_sensor_by_source_and_name(
    db: Session,
    mon_source_id: UUID,
    sensor_name: str,
) -> Optional[MonitoringSensor]:
    """Return the first sensor matching the source and name."""
    return (
        db.query(MonitoringSensor)
          .filter(
              MonitoringSensor.mon_source_id == mon_source_id,
              MonitoringSensor.sensor_name == sensor_name,
          )
          .first()
    )