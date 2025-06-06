from app.monitoring_source.models import Source, MonLoc, Project
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from typing import List, Optional, Any


def get_source(db: Session, source_id: int) -> Optional[Source]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(MonLoc.project))
        .filter(Source.id == source_id)
        .first()
    )

def get_sources(db: Session, skip: int = 0, limit: int = 100) -> list[type[Source]]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(MonLoc.project))
        .offset(skip)
        .limit(limit)
        .all()
    )