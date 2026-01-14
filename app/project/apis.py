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
from app.organizations.dependencies import get_current_org_id

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
):
    return services.create_project(db, payload, org_id=org_id)

@router.get(
    "/{project_id}/locations",
    response_model=List[location_schemas.Location]
)
def list_project_locations(
    project_id: UUID,
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    if not selectors.get_project(db, project_id, org_id=org_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    
    locations = location_services.list_locations_for_project(db, project_id, skip=skip, org_id=org_id)
    return [location_services.enrich_location(loc) for loc in locations]

@router.get(
    "/{project_id}/sources",
    response_model=List[source_schemas.Source]
)
def list_project_sources(
    project_id: UUID,
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    if not selectors.get_project(db, project_id, org_id=org_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    
    sources = source_services.list_sources_for_project(db, project_id, skip=skip, org_id=org_id)
    return [source_services.enrich_source(src) for src in sources]

@router.get(
    "/{project_id}/sensors",
    response_model=List[sensor_schemas.MonitoringSensor]
)
def list_project_sensors(
    project_id: UUID,
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    if not selectors.get_project(db, project_id, org_id=org_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")

    sensors = sensor_services.list_sensors_for_project(db, project_id, skip=skip, org_id=org_id)
    return [sensor_services.enrich_sensor(sen) for sen in sensors]

@router.get("/{project_id}", response_model=schemas.Project)
def get_project(project_id: UUID, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)):
    obj = selectors.get_project(db, project_id, org_id=org_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return obj

@router.get("/by-number/{project_number}", response_model=schemas.Project)
def get_project_by_number(project_number: str, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)):
    obj = selectors.get_project_by_number(db, project_number, org_id=org_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return obj

@router.get("/", response_model=List[schemas.Project])
def list_projects(
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    return selectors.get_projects(db, skip=skip, org_id=org_id)

@router.patch("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: UUID,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    obj = services.update_project(db, project_id, payload, org_id=org_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return obj

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)):
    ok = services.delete_project(db, project_id, org_id=org_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return