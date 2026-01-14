from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.location.models import Location
from app.project.models import Project

def get_location(db: Session, loc_id: UUID, org_id: UUID) -> Optional[Location]:
    return (
        db.query(Location)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(Location.project))
        .filter(Location.id == loc_id)
        .filter(Project.org_id == org_id)
        .first()
    )

def get_locations(
    db: Session,
    org_id: UUID,
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[UUID] = None,
) -> List[Location]:
    query = (
        db.query(Location)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(Location.project))
        .filter(Project.org_id == org_id)
    )
    if project_id is not None:
        query = query.filter(Location.project_id == project_id)
    return query.offset(skip).limit(limit).all()

def get_location_by_name(
    db: Session,
    org_id: UUID,
    location_name: str
) -> Optional[Location]:
    return (
        db.query(Location)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(Location.project))
        .filter(Location.loc_name == location_name)
        .filter(Project.org_id == org_id)
        .first()
    )