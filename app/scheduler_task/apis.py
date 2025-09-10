from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from app.scheduler_task import schemas, selectors, services
from app.scheduler_task.services import run_task_by_id

router = APIRouter(prefix="/tasks", tags=["Scheduler Tasks"])

@router.post("/", response_model=schemas.SchedulerTask, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.SchedulerTaskCreate,
    db: Session = Depends(get_db),
):
    # optional: guard against duplicate names
    if selectors.get_task_by_name(db, payload.name):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Task name already exists")
    return services.create_task(db, payload)

@router.get("/{task_id}", response_model=schemas.SchedulerTask)
def get_task(task_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_task(db, task_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return obj

@router.get("/", response_model=List[schemas.SchedulerTask])
def list_tasks(
    skip: int = 0,
    limit: int = 100,
    enabled: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return services.list_tasks(db, skip=skip, limit=limit, enabled=enabled)

@router.get("/name/{task_name}", response_model=schemas.SchedulerTask, status_code=status.HTTP_200_OK)
def get_task_by_name(task_name: str, db: Session = Depends(get_db)):
    obj = selectors.get_task_by_name(db, task_name)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return obj

@router.patch("/{task_id}", response_model=schemas.SchedulerTask)
def update_task(
    task_id: UUID,
    payload: schemas.SchedulerTaskUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_task(db, task_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    return obj

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: UUID, db: Session = Depends(get_db)):
    ok = services.delete_task(db, task_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")

@router.post("/{task_id}/run", response_model=schemas.SchedulerTask)
def run_task_endpoint(
    task_id: UUID,
    force: bool = False,
    lock_timeout_sec: int = 300,
    worker_id: Optional[str] = None,
    db: Session = Depends(get_db),
    ):
    obj = run_task_by_id(db, task_id, force=force, lock_timeout_sec=lock_timeout_sec, worker_id=worker_id)
    if obj is None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Task not claimable or not found")
    return obj