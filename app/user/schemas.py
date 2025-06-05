from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

#––– Input / Update models –––
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name:  Optional[str] = None
    phone:      Optional[str] = None
    active:     Optional[int] = 1

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name:  Optional[str] = None
    phone:      Optional[str] = None
    active:     Optional[int] = None

#––– Output models –––
class UserRead(UserBase):
    id:           UUID
    created_at:   datetime
    last_updated: datetime

    class Config:
        orm_mode = True

#––– Auth models –––
class Token(BaseModel):
    access_token: str
    token_type:   str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None
