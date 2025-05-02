from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.user.models import User

async def get_user(db: AsyncSession, user_id: str) -> User | None:
    return await db.get(User, user_id)

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()
