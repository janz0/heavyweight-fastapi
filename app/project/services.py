# File: app/project/services.py

from uuid import UUID
from sqlalchemy.orm import Session
from app.project.models import Project as ProjectModel
from app.project.schemas import ProjectCreate, ProjectUpdate
from app.project.selectors import get_project_model

def create_project(db: Session, payload: ProjectCreate) -> ProjectModel:
    obj = ProjectModel(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_project(
    db: Session,
    project_id: UUID,
    payload: ProjectUpdate
) -> ProjectModel | None:
    obj = get_project_model(db, project_id)   # ← raw ORM instance
    if not obj:
        return None

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(obj, field, val)

    db.commit()
    db.refresh(obj)
    return obj

def delete_project(db: Session, project_id: UUID) -> None:
    obj = db.get(ProjectModel, project_id)
    if obj:
        db.delete(obj)
        db.commit()
