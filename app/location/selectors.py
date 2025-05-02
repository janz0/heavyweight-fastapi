from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.location.models import Location


def get_location(db: Session, loc_id: UUID) -> Optional[Location]:
    return db.query(Location).filter(Location.id == loc_id).first()


def get_locations(db: Session, skip: int = 0, limit: int = 100) -> List[Location]:
    return db.query(Location).offset(skip).limit(limit).all()