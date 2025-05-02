from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_sensor_baseline import schemas, selectors, services

router = APIRouter(prefix="/monitoring-sensor-baselines", tags=["MonitoringSensorBaselines"])

@router.post("/", response_model=schemas.MonitoringSensorBaseline, status_code=status.HTTP_201_CREATED)
def create_monitoring_sensor_baseline(
    payload: schemas.MonitoringSensorBaselineCreate,
    db: Session = Depends(get_db),
):
    return services.create_monitoring_sensor_baseline(db, payload)

@router.get("/", response_model=List[schemas.MonitoringSensorBaseline])
def list_monitoring_sensor_baselines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_monitoring_sensor_baselines(db, skip=skip, limit=limit)

@router.get("/{baseline_id}", response_model=schemas.MonitoringSensorBaseline)
def get_monitoring_sensor_baseline(baseline_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_monitoring_sensor_baseline(db, baseline_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorBaseline not found")
    return obj

@router.patch("/{baseline_id}", response_model=schemas.MonitoringSensorBaseline)
def update_monitoring_sensor_baseline(
    baseline_id: UUID,
    payload: schemas.MonitoringSensorBaselineUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_monitoring_sensor_baseline(db, baseline_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorBaseline not found")
    return obj

@router.delete("/{baseline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_sensor_baseline(baseline_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_monitoring_sensor_baseline(db, baseline_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorBaseline not found")
    services.delete_monitoring_sensor_baseline(db, baseline_id)