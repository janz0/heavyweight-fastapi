from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MonitoringSensorFieldBase(BaseModel):
    field_name: str
    uom: Optional[str] = None
    is_calculated: Optional[bool] = False
    field_type: Optional[str] = None

class MonitoringSensorFieldCreate(MonitoringSensorFieldBase):
    pass

class MonitoringSensorFieldUpdate(BaseModel):
    field_name: Optional[str]
    uom: Optional[str]
    is_calculated: Optional[bool]
    field_type: Optional[str]

class MonitoringSensorField(MonitoringSensorFieldBase):
    id: UUID
    sensor_id: UUID

    class Config:
        orm_mode = True
