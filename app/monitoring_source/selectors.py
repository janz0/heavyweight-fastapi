from app.monitoring_source.models import Source
from app.location.models import Location
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from uuid import UUID


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

def get_source_by_name(db: Session, source_name: str) -> Optional[Source]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .filter(Source.source_name == source_name)
        .first()
    )