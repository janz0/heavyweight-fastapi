from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor_fields.models import MonitoringSensorField


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
