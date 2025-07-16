from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class MonitoringGroupBase(BaseModel):
    mon_loc_id: UUID
    group_name: str
    group_type: str
    data: Optional[Any]
    status: Optional[str] = "Created"
    active: Optional[int] = 1

class MonitoringGroupCreate(MonitoringGroupBase):
    pass

class MonitoringGroupUpdate(BaseModel):
    mon_loc_id: Optional[UUID]
    group_name: Optional[str]
    group_type: Optional[str]
    data: Optional[Any]
    status: Optional[str]
    active: Optional[int]

class MonitoringGroup(MonitoringGroupBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True