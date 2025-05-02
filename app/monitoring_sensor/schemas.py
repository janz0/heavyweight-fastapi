from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MonitoringSensorBase(BaseModel):
    loc_group_id: UUID
    sensor_name: str
    sensor_type: str
    unit: str
    threshold: Optional[float]
    active: Optional[int] = 1

class MonitoringSensorCreate(MonitoringSensorBase):
    pass

class MonitoringSensorUpdate(BaseModel):
    loc_group_id: Optional[UUID]
    sensor_name: Optional[str]
    sensor_type: Optional[str]
    unit: Optional[str]
    threshold: Optional[float]
    active: Optional[int]

class MonitoringSensor(MonitoringSensorBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True