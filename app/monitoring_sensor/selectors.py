from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor.models import MonitoringSensor


def get_monitoring_sensor(db: Session, sensor_id: UUID) -> Optional[MonitoringSensor]:
    return db.query(MonitoringSensor).filter(MonitoringSensor.id == sensor_id).first()


def get_monitoring_sensors(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoringSensor]:
    return db.query(MonitoringSensor).offset(skip).limit(limit).all()