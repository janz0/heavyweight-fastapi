# File: app/user/apis.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from app.common.security import create_access_token, get_current_user

from app.user import schemas, selectors, services
from app.user.models import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    # 1) Check if the email is already registered:
    existing = selectors.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # 2) Create the user (services.create_user should hash the password and commit):
    user = services.create_user(db, payload)
    return user


@router.post("/login", response_model=schemas.Token, tags=["Auth"])
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # 1) Authenticate the user (services.authenticate_user must use verify_password on the hash):
    user = services.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")

    # 2) Create a JWT (or similar) and return it:
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserRead)
def me(current: User = Depends(get_current_user)):
    return current
