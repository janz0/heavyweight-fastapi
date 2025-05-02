from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor_baseline.models import MonitoringSensorBaseline


def get_monitoring_sensor_baseline(db: Session, baseline_id: UUID) -> Optional[MonitoringSensorBaseline]:
    return db.query(MonitoringSensorBaseline).filter(MonitoringSensorBaseline.id == baseline_id).first()


def get_monitoring_sensor_baselines(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoringSensorBaseline]:
    return db.query(MonitoringSensorBaseline).offset(skip).limit(limit).all()