from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MonitoringSensorAlertBase(BaseModel):
    sensor_id: UUID
    alert_type: str
    message: Optional[str]
    active: Optional[int] = 1

class MonitoringSensorAlertCreate(MonitoringSensorAlertBase):
    pass

class MonitoringSensorAlertUpdate(BaseModel):
    sensor_id: Optional[UUID]
    alert_type: Optional[str]
    message: Optional[str]
    active: Optional[int]

class MonitoringSensorAlert(MonitoringSensorAlertBase):
    id: UUID
    triggered_at: datetime
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True