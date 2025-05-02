from sqlalchemy.orm import Session
from uuid import UUID
from app.location import schemas, selectors
from app.location.models import Location


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