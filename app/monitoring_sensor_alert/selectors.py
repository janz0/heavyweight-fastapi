from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor_alert.models import MonitoringSensorAlert


def get_monitoring_sensor_alert(db: Session, alert_id: UUID) -> Optional[MonitoringSensorAlert]:
    return db.query(MonitoringSensorAlert).filter(MonitoringSensorAlert.id == alert_id).first()


def get_monitoring_sensor_alerts(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoringSensorAlert]:
    return db.query(MonitoringSensorAlert).offset(skip).limit(limit).all()