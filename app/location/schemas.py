from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class LocationBase(BaseModel):
    project_id: UUID
    loc_number: Optional[str] = ""
    loc_name: str
    lat: float
    lon: float
    frequency: str
    active: Optional[int] = 1

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    project_id: Optional[UUID] = None
    loc_number: Optional[str] = None
    loc_name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    frequency: Optional[str] = None
    active: Optional[int] = None

class LocationMetadata(BaseModel):
    project_number: Optional[str] = None
    project_name: str

class Location(LocationBase):
    id: UUID
    created_at: datetime
    last_updated: datetime
    details: Optional[LocationMetadata] = None

    class Config:
        orm_mode = True