from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.location_task import schemas, selectors, services

router = APIRouter(prefix="/location-tasks", tags=["Location Tasks"])

@router.post("/", response_model=schemas.LocationTask, status_code=status.HTTP_201_CREATED)
def create_location_task(
    payload: schemas.LocationTaskCreate,
    db: Session = Depends(get_db),
):
    return services.create_location_task(db, payload)

@router.get("/", response_model=List[schemas.LocationTask])
def list_location_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_location_tasks(db, skip=skip, limit=limit)

@router.get("/{task_id}", response_model=schemas.LocationTask)
def get_location_task(task_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_location_task(db, task_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "LocationTask not found")
    return obj

@router.patch("/{task_id}", response_model=schemas.LocationTask)
def update_location_task(
    task_id: UUID,
    payload: schemas.LocationTaskUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_location_task(db, task_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "LocationTask not found")
    return obj

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_task(task_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_location_task(db, task_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "LocationTask not found")
    services.delete_location_task(db, task_id)