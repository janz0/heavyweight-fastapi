# app/project/selectors.py

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.project.models  import Project as ProjectModel
from app.project.schemas import Project as ProjectSchema

def get_projects(db: Session, org_id: UUID, skip: int = 0) -> List[ProjectSchema]:
    stmt     = select(ProjectModel).where(ProjectModel.org_id == org_id).order_by(ProjectModel.start_date.desc()).offset(skip)
    projects = db.execute(stmt).scalars().all()
    return [ProjectSchema.model_validate(p) for p in projects]

def get_project(db: Session, project_id: UUID, org_id: UUID) -> Optional[ProjectSchema]:
    stmt = select(ProjectModel).where(ProjectModel.id == project_id, ProjectModel.org_id == org_id)
    p = db.execute(stmt).scalars().first()
    return ProjectSchema.model_validate(p) if p else None

def get_project_model(db: Session, project_id: UUID, org_id: UUID) -> Optional[ProjectModel]:
    stmt = select(ProjectModel).where(
        ProjectModel.id == project_id,
        ProjectModel.org_id == org_id,
    )
    return db.execute(stmt).scalars().first()

def get_project_by_number(db: Session, project_number: int, org_id: UUID) -> Optional[ProjectSchema]:
    stmt = select(ProjectModel).where(ProjectModel.project_number == project_number, ProjectModel.org_id == org_id)
    p = db.execute(stmt).scalars().first()
    return ProjectSchema.model_validate(p) if p else None

def get_projects_for_team(
    db: Session,
    team_id: UUID,
    org_id: UUID,
    skip: int = 0,
) -> List[ProjectSchema]:
    stmt = (
        select(ProjectModel)
        .where(
            ProjectModel.org_id == org_id,
            ProjectModel.team_id == team_id
        )
        .order_by(ProjectModel.start_date.desc())
        .offset(skip)
    )
    projects = db.execute(stmt).scalars().all()
    return [ProjectSchema.model_validate(p) for p in projects]