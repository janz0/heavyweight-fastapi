from pydantic import BaseModel
from typing import Any, Optional
from uuid import UUID
from datetime import datetime

class MonitoringSensorDataBase(BaseModel):
    mon_loc_id: UUID
    sensor_id: UUID
    data: Any
    is_processed: Optional[bool] = False

class MonitoringSensorDataCreate(MonitoringSensorDataBase):
    pass

class MonitoringSensorDataUpdate(BaseModel):
    mon_loc_id: Optional[UUID]
    sensor_id: Optional[UUID]
    data: Optional[Any]
    is_processed: Optional[bool]

class MonitoringSensorData(MonitoringSensorDataBase):
    id: int
    timestamp: datetime
    last_updated: datetime

    class Config:
        orm_mode = True