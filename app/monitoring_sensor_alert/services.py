from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor_alert import schemas, selectors
from app.monitoring_sensor_alert.models import MonitoringSensorAlert


def create_monitoring_sensor_alert(db: Session, payload: schemas.MonitoringSensorAlertCreate) -> MonitoringSensorAlert:
    obj = MonitoringSensorAlert(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_monitoring_sensor_alert(db: Session, alert_id: UUID, payload: schemas.MonitoringSensorAlertUpdate) -> MonitoringSensorAlert:
    obj = selectors.get_monitoring_sensor_alert(db, alert_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_monitoring_sensor_alert(db: Session, alert_id: UUID) -> None:
    obj = selectors.get_monitoring_sensor_alert(db, alert_id)
    if obj:
        db.delete(obj)
        db.commit()