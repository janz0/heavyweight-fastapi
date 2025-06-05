# File: app/user/selectors.py

from sqlalchemy import select
from sqlalchemy.orm import Session
from app.user.models import User

def get_user(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)

def get_user_by_email(db: Session, email: str) -> User | None:
    result = db.execute(select(User).where(User.email == email))
    return result.scalars().first()
