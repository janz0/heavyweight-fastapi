from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.project import schemas, selectors, services
from app.location import schemas as location_schemas
import app.location.services  as location_services

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
):
    return services.create_project(db, payload)

@router.get(
    "/{project_id}/locations",
    response_model=List[location_schemas.Location]
)
def list_project_locations(
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return location_services.list_locations_for_project(db, project_id, skip=skip, limit=limit)

@router.get("/{project_id}", response_model=schemas.Project)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_project(db, project_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return obj

@router.get("/", response_model=List[schemas.Project])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_projects(db, skip=skip, limit=limit)

@router.patch("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: UUID,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_project(db, project_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return obj

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_project(db, project_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    services.delete_project(db, project_id)