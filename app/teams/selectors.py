# app/team/selectors.py

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.teams.models import Team as TeamModel, TeamMember as TeamMemberModel
from app.teams.schemas import Team as TeamSchema, TeamMember as TeamMemberSchema

def get_teams(db: Session, skip: int = 0) -> List[TeamSchema]:
    stmt = (
        select(TeamModel)
        .order_by(TeamModel.name.asc())
        .offset(skip)
    )
    teams = db.execute(stmt).scalars().all()
    return [TeamSchema.model_validate(t) for t in teams]

def get_team(db: Session, team_id: UUID) -> Optional[TeamSchema]:
    stmt = select(TeamModel).where(TeamModel.id == team_id)
    t = db.execute(stmt).scalars().first()
    return TeamSchema.model_validate(t) if t else None

def get_team_model(db: Session, team_id: UUID) -> Optional[TeamModel]:
    """Return raw ORM instance (for services)."""
    return db.get(TeamModel, team_id)

def get_team_members(db: Session, team_id: UUID) -> List[TeamMemberSchema]:
    stmt = select(TeamMemberModel).where(TeamMemberModel.team_id == team_id)
    members = db.execute(stmt).scalars().all()
    return [TeamMemberSchema.model_validate(m) for m in members]

def get_teams_for_user(db: Session, user_id: UUID, skip: int = 0) -> List[TeamSchema]:
    stmt = (
        select(TeamModel)
        .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
        .where(TeamMemberModel.user_id == user_id)
        .order_by(TeamModel.name.asc())
        .offset(skip)
    )
    teams = db.execute(stmt).scalars().all()
    return [TeamSchema.model_validate(t) for t in teams]

def get_teams_for_org(db: Session, org_id: UUID, skip: int = 0) -> list[TeamSchema]:
    stmt = (
        select(TeamModel)
        .where(TeamModel.org_id == org_id)
        .order_by(TeamModel.name.asc())
        .offset(skip)
    )
    teams = db.execute(stmt).scalars().all()
    return [TeamSchema.model_validate(t) for t in teams]

def get_team_member(
    db: Session,
    team_id: UUID,
    user_id: UUID,
) -> Optional[TeamMemberSchema]:
    stmt = select(TeamMemberModel).where(
        TeamMemberModel.team_id == team_id,
        TeamMemberModel.user_id == user_id,
    )
    m = db.execute(stmt).scalars().first()
    return TeamMemberSchema.model_validate(m) if m else None