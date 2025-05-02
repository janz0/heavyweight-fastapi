from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class ProjectBase(BaseModel):
    project_number: Optional[str]
    project_name: str
    description: Optional[str]
    start_date: date
    end_date: Optional[date]
    status: str
    active: Optional[int] = 1

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_number: Optional[str]
    project_name: Optional[str]
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    status: Optional[str]
    active: Optional[int]

class Project(ProjectBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True