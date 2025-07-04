from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from app.monitoring_sensor.models import MonitoringSensor


def get_monitoring_sensor(
    db: Session,
    sensor_id: UUID
) -> Optional[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          # load the related Source so we can read source.source_name
          .options(joinedload(MonitoringSensor.mon_source))
          .filter(MonitoringSensor.id == sensor_id)
          .first()
    )

def get_monitoring_sensors(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[MonitoringSensor]:
    return (
        db.query(MonitoringSensor)
          # same eager-load on the list endpoint
          .options(joinedload(MonitoringSensor.mon_source))
          .offset(skip)
          .limit(limit)
          .all()
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