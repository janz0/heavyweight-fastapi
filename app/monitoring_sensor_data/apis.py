from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_sensor_data import schemas, selectors, services

router = APIRouter(prefix="/monitoring-sensor-data", tags=["Monitoring Sensor Data"])

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


@router.get("/query", response_model=List[schemas.MonitoringSensorDataQueryResult])
def query_monitoring_sensor_data(
    project_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    sensor_id: Optional[UUID] = None,
    sensor_type: Optional[str] = None,
    sensor_group_id: Optional[UUID] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    aggregate_period: Optional[str] = None,
    trim_percentile_low: Optional[float] = None,
    trim_percentile_high: Optional[float] = None,
    db: Session = Depends(get_db),
):
    return selectors.query_monitoring_sensor_data(
        db,
        project_id=project_id,
        location_id=location_id,
        sensor_id=sensor_id,
        sensor_type=sensor_type,
        sensor_group_id=sensor_group_id,
        start=start,
        end=end,
        aggregate_period=aggregate_period,
        trim_low=trim_percentile_low,
        trim_high=trim_percentile_high,
    )

@router.get("/{sensor_field_id}/{timestamp}", response_model=schemas.MonitoringSensorData)
def get_monitoring_sensor_data(sensor_field_id: UUID, timestamp: datetime, db: Session = Depends(get_db)):
    obj = selectors.get_monitoring_sensor_data_entry(db, sensor_field_id, timestamp)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    return obj

@router.patch("/{sensor_field_id}/{timestamp}", response_model=schemas.MonitoringSensorData)
def update_monitoring_sensor_data(sensor_field_id: UUID, timestamp: datetime, payload: schemas.MonitoringSensorDataUpdate, db: Session = Depends(get_db)):
    obj = services.update_monitoring_sensor_data(db, sensor_field_id, timestamp, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    return obj

@router.delete("/{sensor_field_id}/{timestamp}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_sensor_data(sensor_field_id: UUID, timestamp: datetime, db: Session = Depends(get_db)):
    if not selectors.get_monitoring_sensor_data_entry(db, sensor_field_id, timestamp):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    services.delete_monitoring_sensor_data(db, sensor_field_id, timestamp)

@router.post("/bulk-from-source", status_code=201)
def create_bulk_sensor_data_from_source(
    payload: schemas.MonitoringSensorDataBulkRequest,
    db: Session = Depends(get_db),
):
    return services.create_bulk_sensor_data_from_source(db, payload)
