from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy import String


class MonitoringSensorDataBase(BaseModel):
    mon_loc_id: UUID
    sensor_id: UUID
    sensor_field_id: UUID
    timestamp: datetime
    data: float
    is_approved: Optional[bool] = False

class MonitoringSensorDataCreate(MonitoringSensorDataBase):
    pass

class MonitoringSensorDataUpdate(BaseModel):
    data: Optional[float]
    is_approved: Optional[bool]

class MonitoringSensorData(MonitoringSensorDataBase):
    last_updated: datetime

    class Config:
        orm_mode = True

# Bulk ingestion format
class FieldValueRaw(BaseModel):
    field_id: UUID
    value: float

class SensorDataRaw(BaseModel):
    sensor_id: UUID
    data: List[FieldValueRaw]

class BulkSensorDataItem(BaseModel):
    timestamp: datetime
    source_id: UUID
    mon_loc_id: UUID
    sensor_type: str
    sensors: List[SensorDataRaw]

class MonitoringSensorDataBulkRequest(BaseModel):
    items: List[BulkSensorDataItem]


# Response model for queried/aggregated sensor data
class MonitoringSensorDataQueryResult(BaseModel):
    timestamp: datetime
    sensor_id: UUID
    sensor_field_id: UUID
    data: float

    class Config:
        orm_mode = True
