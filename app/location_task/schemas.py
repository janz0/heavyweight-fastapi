from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class LocationTaskBase(BaseModel):
    loc_id: UUID
    task_name: str
    description: Optional[str]
    due_date: Optional[datetime]
    status: Optional[str] = "pending"
    active: Optional[int] = 1

class LocationTaskCreate(LocationTaskBase):
    pass

class LocationTaskUpdate(BaseModel):
    loc_id: Optional[UUID]
    task_name: Optional[str]
    description: Optional[str]
    due_date: Optional[datetime]
    status: Optional[str]
    active: Optional[int]

class LocationTask(LocationTaskBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True