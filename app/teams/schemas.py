# app/team/schemas.py

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    """Payload for creating a team."""
    pass

class TeamUpdate(BaseModel):
    """Partial update for team."""
    name: Optional[str] = None

class Team(TeamBase):
    id: UUID
    org_id: UUID
    created_at: datetime
    last_updated: datetime
    members_count: int

    model_config = ConfigDict(from_attributes=True)

class TeamMemberBase(BaseModel):
    team_id: UUID
    user_id: UUID
    role: str = "member"


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    role: Optional[str] = None


class TeamMember(TeamMemberBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)