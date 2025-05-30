from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_sensor_alert import schemas, selectors, services

router = APIRouter(prefix="/monitoring-sensor-alerts", tags=["Monitoring Sensor Alerts"])

@router.post("/", response_model=schemas.MonitoringSensorAlert, status_code=status.HTTP_201_CREATED)
def create_monitoring_sensor_alert(
    payload: schemas.MonitoringSensorAlertCreate,
    db: Session = Depends(get_db),
):
    return services.create_monitoring_sensor_alert(db, payload)

@router.get("/", response_model=List[schemas.MonitoringSensorAlert])
def list_monitoring_sensor_alerts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_monitoring_sensor_alerts(db, skip=skip, limit=limit)

@router.get("/{alert_id}", response_model=schemas.MonitoringSensorAlert)
def get_monitoring_sensor_alert(alert_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_monitoring_sensor_alert(db, alert_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorAlert not found")
    return obj

@router.patch("/{alert_id}", response_model=schemas.MonitoringSensorAlert)
def update_monitoring_sensor_alert(
    alert_id: UUID,
    payload: schemas.MonitoringSensorAlertUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_monitoring_sensor_alert(db, alert_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorAlert not found")
    return obj

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_sensor_alert(alert_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_monitoring_sensor_alert(db, alert_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorAlert not found")
    services.delete_monitoring_sensor_alert(db, alert_id)