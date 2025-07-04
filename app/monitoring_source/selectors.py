from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.location.models import Location
from app.monitoring_source.models import Source


def get_source(db: Session, source_id: UUID) -> Optional[Source]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .filter(Source.id == source_id)
        .first()
    )


def get_sources(db: Session, skip: int = 0, limit: int = 100) -> list[type[Source]]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_source_updates(db: Session, skip: int = 0, limit: int = 100):
    """Return only the id and last_updated fields for all sources."""

    return db.query(Source.id, Source.last_updated).offset(skip).limit(limit).all()
