from sqlalchemy.orm import Session
from uuid import UUID
from app.project import schemas, selectors
from app.project.models import Project


def create_project(db: Session, payload: schemas.ProjectCreate) -> Project:
    obj = Project(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_project(db: Session, project_id: UUID, payload: schemas.ProjectUpdate) -> Project:
    obj = selectors.get_project(db, project_id)
    if not obj:
        return None
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(obj, attr, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete_project(db: Session, project_id: UUID) -> None:
    obj = selectors.get_project(db, project_id)
    if obj:
        db.delete(obj)
        db.commit()