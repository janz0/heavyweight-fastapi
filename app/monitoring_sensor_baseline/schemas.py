from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MonitoringSensorBaselineBase(BaseModel):
    sensor_id: UUID
    baseline_value: float
    active: Optional[int] = 1

class MonitoringSensorBaselineCreate(MonitoringSensorBaselineBase):
    pass

class MonitoringSensorBaselineUpdate(BaseModel):
    sensor_id: Optional[UUID]
    baseline_value: Optional[float]
    active: Optional[int]

class MonitoringSensorBaseline(MonitoringSensorBaselineBase):
    id: UUID
    recorded_at: datetime
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True