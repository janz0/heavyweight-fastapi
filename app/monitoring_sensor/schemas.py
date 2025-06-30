from pydantic import BaseModel, Field
from typing import Optional, List
from app.monitoring_sensor_fields.schemas import MonitoringSensorField, MonitoringSensorFieldName
from uuid import UUID
from datetime import datetime

class MonitoringSensorBase(BaseModel):
    mon_source_id: UUID
    sensor_group_id: Optional[UUID] = None
    source_name: Optional[str] = None
    sensor_name: str
    sensor_type: str
    active: Optional[int] = 1

    class Config:
        orm_mode = True
        
class MonitoringSensorCreate(MonitoringSensorBase):
    pass

class MonitoringSensorUpdate(BaseModel):
    mon_source_id: Optional[UUID]
    sensor_group_id: Optional[UUID]
    sensor_name: Optional[str]
    sensor_type: Optional[str]
    active: Optional[int]

class MonitoringSensor(MonitoringSensorBase):
    id: UUID
    created_at: datetime
    last_updated: datetime

    class Config:
        orm_mode = True


class MonitoringSensorWithFields(MonitoringSensor):
    fields: List[MonitoringSensorField] = Field(default_factory=list)


class MonitoringSensorName(BaseModel):
    id: UUID
    sensor_name: str

    class Config:
        orm_mode = True


class MonitoringSensorNameWithFields(MonitoringSensorName):
    fields: List[MonitoringSensorFieldName] = Field(default_factory=list)

