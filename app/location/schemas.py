from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class LocationBase(BaseModel):
    project_id: UUID
    loc_number: Optional[str]
    loc_name: str
    lat: float
    lon: float
    frequency: str
    active: Optional[int] = 1

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    project_id: Optional[UUID]
    loc_number: Optional[str]
    loc_name: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    frequency: Optional[str]
    active: Optional[int]

class Location(LocationBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True