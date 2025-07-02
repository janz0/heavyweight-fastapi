from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.project import schemas, selectors, services
from app.location import schemas as location_schemas
import app.location.services  as location_services
from app.monitoring_source import schemas as source_schemas, services as source_services
from app.monitoring_sensor import schemas as sensor_schemas, services as sensor_services

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
    locations = location_services.list_locations_for_project(db, project_id, skip=skip, limit=limit)
    return [location_services.enrich_location(loc) for loc in locations]

@router.get(
    "/{project_id}/sources",
    response_model=List[source_schemas.Source]
)
def list_project_sources(
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    sources = source_services.list_sources_for_project(db, project_id, skip=skip, limit=limit)
    return [source_services.enrich_source(src) for src in sources]

@router.get(
    "/{project_id}/sensors",
    response_model=List[sensor_schemas.MonitoringSensor]
)
def list_project_sensors(
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    sensors = sensor_services.list_sensors_for_project(db, project_id, skip=skip, limit=limit)
    return [sensor_services.enrich_sensor(sen) for sen in sensors]

@router.get("/{project_id}", response_model=schemas.Project)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_project(db, project_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return obj

@router.get("/by-number/{project_number}", response_model=schemas.Project)
def get_project_by_number(project_number: str, db: Session = Depends(get_db)):
    obj = selectors.get_project_by_number(db, project_number)
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