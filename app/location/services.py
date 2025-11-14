from sqlalchemy.orm import Session
from uuid import UUID
from app.location import schemas, selectors
from app.location.models import Location
from typing import Optional, List

def create_location(db: Session, payload: schemas.LocationCreate) -> Location:
    obj = Location(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_location(db: Session, loc_id: UUID, payload: schemas.LocationUpdate) -> Location:
    obj = selectors.get_location(db, loc_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_location(db: Session, loc_id: UUID) -> None:
    obj = selectors.get_location(db, loc_id)
    if obj:
        db.delete(obj)
        db.commit()

def list_locations_for_project(
    db: Session,
    project_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[schemas.Location]:
    return selectors.get_locations(db, skip=skip, limit=limit, project_id=project_id)

def get_location_by_name(
    db: Session,
    location_name: str
) -> Optional[dict]:
    location = selectors.get_location_by_name(db, location_name)
    if not location:
        return None
    return enrich_location(location)

def enrich_location(location: Location) -> dict:
    details = None
    if location.project:
        details = schemas.LocationMetadata(
            project_name = location.project.project_name,
            project_number = location.project.project_number,
        )
    location_dict = dict(location.__dict__)
    location_dict["details"] = details
    model = schemas.Location.model_construct(**location_dict)
    return model.model_dump()
