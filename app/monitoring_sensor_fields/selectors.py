from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID
from app.monitoring_sensor_fields.models import MonitoringSensorField
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_source.models import Source
from app.location.models import Location
from app.project.models import Project

def get_sensor_field_in_org(db: Session, field_id: UUID, org_id: UUID) -> Optional[MonitoringSensorField]:
    stmt = (
        select(MonitoringSensorField)
        .join(MonitoringSensor, MonitoringSensorField.sensor_id == MonitoringSensor.id)
        .join(Source, MonitoringSensor.mon_source_id == Source.id)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .where(MonitoringSensorField.id == field_id)
        .where(Project.org_id == org_id)
    )
    return db.execute(stmt).scalars().first()

def get_sensor_field(db: Session, field_id: UUID) -> Optional[MonitoringSensorField]:
    return db.query(MonitoringSensorField).filter(MonitoringSensorField.id == field_id).first()

def get_sensor_fields(db: Session, sensor_id: UUID) -> List[MonitoringSensorField]:
    return (
        db.query(MonitoringSensorField)
        .filter(MonitoringSensorField.sensor_id == sensor_id)
        .order_by(MonitoringSensorField.field_name)
        .all()
    )

def get_sensor_field_by_sensor_and_name(
    db: Session,
    sensor_id: UUID,
    field_name: str,
) -> Optional[MonitoringSensorField]:
    """Return the first sensor field matching sensor and field name."""
    return (
        db.query(MonitoringSensorField)
          .filter(
              MonitoringSensorField.sensor_id == sensor_id,
              MonitoringSensorField.field_name == field_name,
          )
          .first()
    )
