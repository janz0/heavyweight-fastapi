# app/common/user_crud.py
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.user.models import User as UserModel
from app.common.auth_schemas import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[UserModel]:
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    return result.scalars().first()

async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[UserModel]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

async def create_user(db: AsyncSession, new_user: UserCreate) -> UserModel:
    user = UserModel(
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        password_hash=get_password_hash(new_user.password),
        active=new_user.active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
