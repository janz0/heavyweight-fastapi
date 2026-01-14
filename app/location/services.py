from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.location import schemas, selectors
from app.location.models import Location
from app.project.models import Project

def _assert_project_in_org(db: Session, project_id: UUID, org_id: UUID) -> None:
    ok = (
        db.query(Project.id)
        .filter(Project.id == project_id)
        .filter(Project.org_id == org_id)
        .first()
    )
    if not ok:
        # raise None here and let the router convert to 404/403 if you prefer,
        # but raising is fine too.
        raise ValueError("Project not found in organization")

def create_location(db: Session, payload: schemas.LocationCreate, org_id: UUID) -> Location:
    _assert_project_in_org(db, payload.project_id, org_id)

    obj = Location(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_location(db: Session, loc_id: UUID, payload: schemas.LocationUpdate, org_id: UUID) -> Location:
    obj = selectors.get_location(db, loc_id, org_id=org_id)
    if not obj:
        return None
    data = payload.model_dump(exclude_unset=True)

    # If allowing moving locations between projects, validate the new project is in org.
    if "project_id" in data and data["project_id"] is not None:
        _assert_project_in_org(db, data["project_id"], org_id)

    for k, v in data.items():
        setattr(obj, k, v)

    db.commit()
    db.refresh(obj)
    return obj

def delete_location(db: Session, loc_id: UUID, org_id: UUID) -> None:
    obj = selectors.get_location(db, loc_id, org_id=org_id)

    if not obj:
        return False
    
    db.delete(obj)
    db.commit()
    return True

def list_locations_for_project(
    db: Session,
    project_id: UUID,
    org_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[schemas.Location]:
    _assert_project_in_org(db, project_id, org_id)
    return selectors.get_locations(db, org_id=org_id, skip=skip, limit=limit, project_id=project_id)

def get_location_by_name(
    db: Session,
    location_name: str,
    org_id: UUID
) -> Optional[dict]:
    location = selectors.get_location_by_name(db, org_id, location_name)
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
