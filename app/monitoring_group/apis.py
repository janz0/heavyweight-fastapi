from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_group import schemas, selectors, services

router = APIRouter(prefix="/monitoring-groups", tags=["Monitoring Groups"])

@router.post("/", response_model=schemas.MonitoringGroup, status_code=status.HTTP_201_CREATED)
def create_monitoring_group(
    payload: schemas.MonitoringGroupCreate,
    db: Session = Depends(get_db),
):
    return services.create_monitoring_group(db, payload)

@router.get("/", response_model=List[schemas.MonitoringGroup])
def list_monitoring_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_monitoring_groups(db, skip=skip, limit=limit)

@router.get("/{group_id}", response_model=schemas.MonitoringGroup)
def get_monitoring_group(group_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_monitoring_group(db, group_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringGroup not found")
    return obj

@router.patch("/{group_id}", response_model=schemas.MonitoringGroup)
def update_monitoring_group(
    group_id: UUID,
    payload: schemas.MonitoringGroupUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_monitoring_group(db, group_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringGroup not found")
    return obj

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_group(group_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_monitoring_group(db, group_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringGroup not found")
    services.delete_monitoring_group(db, group_id)