# app/organizations/selectors.py
from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.organizations.models import OrganizationMember

def get_org_membership_for_user(db: Session, user_id: UUID) -> Optional[OrganizationMember]:
    stmt = select(OrganizationMember).where(OrganizationMember.user_id == user_id)
    return db.execute(stmt).scalars().first()
