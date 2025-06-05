import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.dependencies import get_db
from app.user.selectors import get_user_by_email
from app.user.schemas import TokenData

# You can pull these from env or a settings module instead
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "replace-me-with-a-strong-secret")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# This tells Swagger UI about your /users/login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    # It’s conventional to put the subject (“sub”) as the user’s unique identifier
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user credentials and return a bearer token.
    TODO: Implement actual authentication logic using get_user_by_email and password verification.
    """
    # Placeholder logic: retrieve user and always deny
    user = await get_user_by_email(db, form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Here you would verify the provided form_data.password against stored hash
    # If valid, create token:
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode and validate the JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise credentials_exc
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exc

    # Fetch the user from the database
    user = await get_user_by_email(db, token_data.email)
    if not user:
        raise credentials_exc

    return user
