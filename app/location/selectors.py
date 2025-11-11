from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.location.models import Location

def get_location(db: Session, loc_id: UUID) -> Optional[Location]:
    return db.query(Location).options(joinedload(Location.project)).filter(Location.id == loc_id).first()

def get_locations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    project_id: Optional[UUID] = None,
) -> List[Location]:
    """
    Fetch a list of Location models, optionally filtered by project_id.
    """
    query = db.query(Location).options(joinedload(Location.project))
    if project_id is not None:
        query = query.filter(Location.project_id == project_id)
    return query.offset(skip).limit(limit).all()

def get_location_by_name(
    db: Session,
    location_name: str
) -> Optional[Location]:
    return (
        db.query(Location).options(joinedload(Location.project)).filter(Location.loc_name == location_name).first()
    )