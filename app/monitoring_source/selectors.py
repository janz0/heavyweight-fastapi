from typing import List, Optional
from uuid import UUID
from sqlalchemy import select

from sqlalchemy.orm import Session, joinedload

from app.location.models import Location
from app.monitoring_source.models import Source
from app.project.models import Project

def get_source(db: Session, source_id: UUID) -> Optional[Source]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .filter(Source.id == source_id)
        .first()
    )

def get_sources(
    db: Session, skip: int = 0, limit: int = 100
) -> List[Source]:
    return (
        db.query(Source)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .order_by(Source.source_name)
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

def get_source_updates(db: Session, skip: int = 0, limit: int = 100):
    """Return only the id and last_updated fields for all sources."""

    return db.query(Source.id, Source.last_updated).offset(skip).limit(limit).all()

def get_accessible_project_ids_subquery(org_id: UUID, user_id: UUID):
    return (
        select(Project.id)
        .where(Project.org_id == org_id)
    )

def get_sources_for_org(
    db: Session,
    org_id: UUID,
    project_ids: Optional[List[UUID]] = None,
    skip: int = 0,
):
    stmt = (
        select(Source)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .where(Project.org_id == org_id)
        .order_by(Source.last_data_upload.desc())
        .offset(skip)
    )

    if project_ids:
        stmt = stmt.where(Location.project_id.in_(project_ids))

    return db.execute(stmt).scalars().all()

def get_sources_for_user(db, org_id: UUID, user_id: UUID, project_ids: Optional[List[UUID]] = None, skip: int = 0):
    accessible_projects = get_accessible_project_ids_subquery(org_id, user_id)

    stmt = (
        select(Source)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .where(Project.org_id == org_id)
        .where(Location.project_id.in_(accessible_projects))
        .order_by(Source.last_data_upload.desc())
        .offset(skip)
    )

    # Optional filter (still must be within accessible set!)
    if project_ids:
        stmt = stmt.where(Location.project_id.in_(project_ids))

    return db.execute(stmt).scalars().all()

def get_source_for_org(db: Session, source_id: UUID, org_id: UUID) -> Optional[Source]:
    return (
        db.query(Source)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .filter(Source.id == source_id)
        .filter(Project.org_id == org_id)
        .first()
    )

def get_source_by_name_for_org(db: Session, source_name: str, org_id: UUID) -> Optional[Source]:
    return (
        db.query(Source)
        .join(Location, Source.mon_loc_id == Location.id)
        .join(Project, Location.project_id == Project.id)
        .options(joinedload(Source.mon_loc).joinedload(Location.project))
        .filter(Source.source_name == source_name)
        .filter(Project.org_id == org_id)
        .first()
    )