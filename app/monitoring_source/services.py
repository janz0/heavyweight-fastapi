from typing import Optional, List
from app.monitoring_source.models import Source
from app.monitoring_source import schemas, selectors
from app.location.models import Location
from sqlalchemy.orm import Session
from uuid import UUID

def create_source(db: Session, payload: schemas.SourceCreate) -> Source:
    obj = Source(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_source(db: Session, source_id: UUID, payload: schemas.SourceUpdate) -> Optional[Source]:
    obj = selectors.get_source(db, source_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_source(db: Session, source_id: UUID) -> None:
    obj = selectors.get_source(db, source_id)
    if obj:
        db.delete(obj)
        db.commit()

def list_sources_for_project(
    db: Session,
    project_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[Source]:
    return (
        db.query(Source)
          .join(Location, Source.mon_loc_id == Location.id)
          .filter(Location.project_id == project_id)
          .offset(skip)
          .limit(limit)
          .all()
    )

def list_sources_for_location(
    db: Session,
    loc_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[Source]:
    return (
        db.query(Source)
          .filter(Source.mon_loc_id == loc_id)
          .offset(skip)
          .limit(limit)
          .all()
    )

def enrich_source(source: Source) -> dict:
    details = None
    if source.mon_loc and source.mon_loc.project:
        details = schemas.SourceMetadata(
            loc_number=source.mon_loc.loc_number,
            loc_name=source.mon_loc.loc_name,
            project_id=source.mon_loc.project.id,
            project_number=source.mon_loc.project.project_number,
            project_name=source.mon_loc.project.project_name,
        )

    # Bypass validation because we already know the model is valid
    source_dict = dict(source.__dict__)  # make a copy
    source_dict["details"] = details  # add the extra field
    source_model = schemas.Source.model_construct(**source_dict)
    return source_model.model_dump()
