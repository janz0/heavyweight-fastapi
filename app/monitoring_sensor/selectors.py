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