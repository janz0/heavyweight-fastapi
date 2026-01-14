# app/organizations/dependencies.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.common.dependencies import get_db
from app.organizations.selectors import get_org_membership_for_user
from app.common.security import get_current_user

NO_ORG_DETAIL = {
    "code": "NO_ORG_MEMBERSHIP",
    "message": "User is not in an organization",
}


def get_current_org_id(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> UUID:
    mem = get_org_membership_for_user(db, user.id)
    if not mem:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=NO_ORG_DETAIL,
        )
    return mem.org_id
