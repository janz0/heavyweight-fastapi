# app/team/services.py

from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.teams.models import Team as TeamModel, TeamMember as TeamMemberModel
from app.teams.schemas import TeamCreate, TeamUpdate
from app.teams.selectors import get_team_model

def create_team(db: Session, payload: TeamCreate) -> TeamModel:
    obj = TeamModel(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def create_team_with_owner(db: Session, payload: TeamCreate, owner_id: UUID, owner_role: str = "owner", org_id: UUID | None = None,
) -> TeamModel:
    data = payload.model_dump()

    if org_id is not None:
        data["org_id"] = org_id

    team = TeamModel(**data)
    db.add(team)
    db.flush()

    member = TeamMemberModel(
        team_id=team.id,
        user_id=owner_id,
        role=owner_role,
    )
    db.add(member)

    db.commit()
    db.refresh(team)
    return team

def update_team(
    db: Session,
    team_id: UUID,
    payload: TeamUpdate,
) -> TeamModel | None:
    obj = get_team_model(db, team_id)
    if not obj:
        return None

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, val)

    db.commit()
    db.refresh(obj)
    return obj


def delete_team(db: Session, team_id: UUID) -> None:
    obj = db.get(TeamModel, team_id)
    if obj:
        db.delete(obj)
        db.commit()

def add_user_to_team(
    db: Session,
    team_id: UUID,
    user_id: UUID,
    role: str = "member",
) -> TeamMemberModel:
    # avoid duplicate membership
    stmt = select(TeamMemberModel).where(
        TeamMemberModel.team_id == team_id,
        TeamMemberModel.user_id == user_id,
    )
    existing = db.execute(stmt).scalars().first()
    if existing:
        # Optionally update role
        if existing.role != role:
            existing.role = role
            db.commit()
            db.refresh(existing)
        return existing

    member = TeamMemberModel(team_id=team_id, user_id=user_id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def remove_user_from_team(
    db: Session,
    team_id: UUID,
    user_id: UUID,
) -> bool:
    stmt = select(TeamMemberModel).where(
        TeamMemberModel.team_id == team_id,
        TeamMemberModel.user_id == user_id,
    )
    member = db.execute(stmt).scalars().first()
    if not member:
        return False

    db.delete(member)
    db.commit()
    return True