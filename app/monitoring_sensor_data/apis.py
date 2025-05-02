from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_sensor_data import schemas, selectors, services

router = APIRouter(prefix="/monitoring-sensor-data", tags=["MonitoringSensorData"])

@router.post("/", response_model=schemas.MonitoringSensorData, status_code=status.HTTP_201_CREATED)
def create_monitoring_sensor_data(
    payload: schemas.MonitoringSensorDataCreate,
    db: Session = Depends(get_db),
):
    return services.create_monitoring_sensor_data(db, payload)

@router.get("/", response_model=List[schemas.MonitoringSensorData])
def list_monitoring_sensor_data(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_monitoring_sensor_data_list(db, skip=skip, limit=limit)

@router.get("/{id}/{timestamp}", response_model=schemas.MonitoringSensorData)
def get_monitoring_sensor_data(
    id: int,
    timestamp: datetime,
    db: Session = Depends(get_db),
):
    obj = selectors.get_monitoring_sensor_data_entry(db, id, timestamp)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    return obj

@router.patch("/{id}/{timestamp}", response_model=schemas.MonitoringSensorData)
def update_monitoring_sensor_data(
    id: int,
    timestamp: datetime,
    payload: schemas.MonitoringSensorDataUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_monitoring_sensor_data(db, id, timestamp, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    return obj

@router.delete("/{id}/{timestamp}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_sensor_data(
    id: int,
    timestamp: datetime,
    db: Session = Depends(get_db),
):
    if not selectors.get_monitoring_sensor_data_entry(db, id, timestamp):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    services.delete_monitoring_sensor_data(db, id, timestamp)