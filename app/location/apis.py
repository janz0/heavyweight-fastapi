from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.location import schemas, selectors, services

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
    return selectors.get_locations(db, skip=skip, limit=limit)

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