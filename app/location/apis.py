from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.location import schemas, selectors, services
from app.monitoring_sensor import schemas as sensor_schemas, services as sensor_services
from app.monitoring_source import schemas as source_schemas, services as source_services

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.post("/", response_model=schemas.Location, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: schemas.LocationCreate,
    db: Session = Depends(get_db),
):
    return services.create_location(db, payload)

@router.get("/{loc_id}", response_model=schemas.Location)
def get_location(loc_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_location(db, loc_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    return obj

@router.get("/", response_model=List[schemas.Location])
def list_locations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    locations = selectors.get_locations(db, skip=skip, limit=limit)
    return [services.enrich_location(location) for location in locations]

@router.get("/name/{location_name}", response_model=schemas.Location, status_code=status.HTTP_200_OK)
def get_location_by_name(
    location_name: str,
    db: Session = Depends(get_db)
):
    obj = services.get_location_by_name(db, location_name)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    return obj

@router.get(
    "/{loc_id}/sensors",
    response_model=List[sensor_schemas.MonitoringSensor]
)
def list_location_sensors(
    loc_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    sensors = sensor_services.list_sensors_for_location(db, loc_id, skip=skip, limit=limit)
    return [sensor_services.enrich_sensor(sen) for sen in sensors]

@router.get(
    "/{loc_id}/sources",
    response_model=List[source_schemas.Source]
)
def list_location_sources(
    loc_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    sources = source_services.list_sources_for_location(db, loc_id, skip=skip, limit=limit)
    return [source_services.enrich_source(src) for src in sources]

@router.patch("/{loc_id}", response_model=schemas.Location)
def update_location(
    loc_id: UUID,
    payload: schemas.LocationUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_location(db, loc_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    return obj

@router.delete("/{loc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(loc_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_location(db, loc_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    services.delete_location(db, loc_id)