from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.dependencies import get_db
from app.common.security import create_access_token, get_current_user

from app.user import schemas, selectors, services
from app.user.models import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.post(
    "/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED
)
async def register(
    payload: schemas.UserCreate, db: AsyncSession = Depends(get_db)
):
    if await selectors.get_user_by_email(db, payload.email):
        raise HTTPException(400, "Email already registered")
    return await services.create_user(db, payload)

@router.post("/login", response_model=schemas.Token, tags=["Auth"])
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await services.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(400, "Incorrect email or password")
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserRead)
async def me(current: User = Depends(get_current_user)):
    return current
