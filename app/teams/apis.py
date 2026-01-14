# app/team/apis.py

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from app.organizations.dependencies import get_current_org_id
from app.teams import schemas, selectors, services

from app.project import schemas as project_schemas
from app.project import selectors as project_selectors

from app.user.models import User
from app.common.security import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.post("/", response_model=schemas.TeamCreate, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: UUID = Depends(get_current_org_id),
):
    return services.create_team_with_owner(
        db,
        payload,
        owner_id=current_user.id,
        owner_role="owner",
        org_id=org_id,
    )

@router.get("/", response_model=List[schemas.Team])
def list_teams(
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    return selectors.get_teams_for_org(db, org_id, skip=skip)

@router.get("/{team_id}", response_model=schemas.Team)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
):
    obj = selectors.get_team(db, team_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return obj

@router.patch("/{team_id}", response_model=schemas.Team)
def update_team(
    team_id: UUID,
    payload: schemas.TeamUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_team(db, team_id, payload)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return obj

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
):
    if not selectors.get_team(db, team_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    services.delete_team(db, team_id)

@router.get("/{team_id}/projects", response_model=List[project_schemas.Project])
def list_team_projects(
    team_id: UUID,
    skip: int = 0,
    db: Session = Depends(get_db),
):
    # ensure team exists first
    team = selectors.get_team(db, team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return project_selectors.get_projects_for_team(db, team_id, skip=skip)

@router.get("/{team_id}/members", response_model=List[schemas.TeamMember])
def list_team_members(
    team_id: UUID,
    db: Session = Depends(get_db),
):
    # 404 if team not found
    if not selectors.get_team(db, team_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return selectors.get_team_members(db, team_id)

@router.post("/{team_id}/members", response_model=schemas.TeamMember, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: UUID,
    payload: schemas.TeamMemberCreate,
    db: Session = Depends(get_db),
):
    if payload.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="team_id in body does not match path",
        )

    member = services.add_user_to_team(
        db, team_id=team_id, user_id=payload.user_id, role=payload.role
    )
    return member

@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
):
    ok = services.remove_user_from_team(db, team_id=team_id, user_id=user_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found",
        )