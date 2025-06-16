from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
from app.monitoring_sensor_data.models import MonitoringSensorData

def get_monitoring_sensor_data_entry(db: Session, sensor_field_id: UUID, timestamp: datetime) -> Optional[MonitoringSensorData]:
    return db.query(MonitoringSensorData).filter(
        MonitoringSensorData.sensor_field_id == sensor_field_id,
        MonitoringSensorData.timestamp == timestamp
    ).first()

def get_monitoring_sensor_data_list(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoringSensorData]:
    return db.query(MonitoringSensorData).offset(skip).limit(limit).all()
