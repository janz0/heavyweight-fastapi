from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MonitoringSensorBase(BaseModel):
    mon_source_id: UUID
    sensor_group_id: Optional[UUID] = None
    sensor_name: str
    sensor_type: str
    active: Optional[int] = 1
        
class MonitoringSensorCreate(MonitoringSensorBase):
    pass

class MonitoringSensorUpdate(BaseModel):
    mon_source_id: Optional[UUID] = None
    sensor_group_id: Optional[UUID] = None
    sensor_name: Optional[str] = None
    sensor_type: Optional[str] = None
    active: Optional[int] = None

class MonitoringSensor(MonitoringSensorBase):
    id: UUID
    created_at: datetime
    last_updated: datetime
    source_name: Optional[str] = None

    class Config:
        from_attributes  = True