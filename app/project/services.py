# File: app/project/services.py

from uuid import UUID
from sqlalchemy.orm import Session
from app.project.models import Project as ProjectModel
from app.project.schemas import ProjectCreate, ProjectUpdate
from app.project.selectors import get_project_model


def create_project(db: Session, payload: ProjectCreate, org_id: UUID) -> ProjectModel:
    obj = ProjectModel(**payload.model_dump(), org_id=org_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_project(
    db: Session,
    project_id: UUID,
    payload: ProjectUpdate,
    org_id: UUID
) -> ProjectModel | None:
    obj = get_project_model(db, project_id, org_id=org_id)
    if not obj:
        return None

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, val)

    db.commit()
    db.refresh(obj)
    return obj

def delete_project(db: Session, project_id: UUID, org_id: UUID) -> bool:
    obj = get_project_model(db, project_id=project_id, org_id=org_id)
    if not obj:
        return False

    db.delete(obj)
    db.commit()
    return True
