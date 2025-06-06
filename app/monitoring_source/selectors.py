from app.monitoring_source.models import Source
from sqlalchemy.orm import Session, joinedload
from typing import Optional


def get_source(db: Session, source_id: int) -> Optional[Source]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Source.mon_loc.project))
        .filter(Source.id == source_id)
        .first()
    )

def get_sources(db: Session, skip: int = 0, limit: int = 100) -> list[type[Source]]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Source.mon_loc.project))
        .offset(skip)
        .limit(limit)
        .all()
    )