# app/organizations/schemas.py
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class OrganizationBase(BaseModel):
    name: str
    slug: Optional[str] = None
    allowed_email_domain: Optional[str] = None

class Organization(OrganizationBase):
    id: UUID
    created_at: datetime
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)

class OrganizationMemberBase(BaseModel):
    org_id: UUID
    user_id: UUID
    role: str = "member"

class OrganizationMember(OrganizationMemberBase):
    id: UUID
    created_at: datetime
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)
