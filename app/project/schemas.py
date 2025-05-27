from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class ProjectBase(BaseModel):
    project_number: Optional[str] = None
    project_name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    status: str
    active: Optional[int] = 1

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_number: Optional[str] = None
    project_name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    active: Optional[int] = None

class Project(ProjectBase):
    id: UUID
    created_at: datetime
    last_updated: datetime
    locations_count: int

    model_config = ConfigDict(from_attributes=True)