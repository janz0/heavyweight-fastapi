from sqlalchemy.orm import Session
from datetime import datetime
from app.monitoring_sensor_data import schemas, selectors
from app.monitoring_sensor_data.models import MonitoringSensorData


def create_monitoring_sensor_data(db: Session, payload: schemas.MonitoringSensorDataCreate) -> MonitoringSensorData:
    obj = MonitoringSensorData(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_monitoring_sensor_data(db: Session, id: int, timestamp: datetime, payload: schemas.MonitoringSensorDataUpdate) -> MonitoringSensorData:
    obj = selectors.get_monitoring_sensor_data_entry(db, id, timestamp)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_monitoring_sensor_data(db: Session, id: int, timestamp: datetime) -> None:
    obj = selectors.get_monitoring_sensor_data_entry(db, id, timestamp)
    if obj:
        db.delete(obj)
        db.commit()