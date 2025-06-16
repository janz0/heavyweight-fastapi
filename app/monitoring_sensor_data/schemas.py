from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

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
    field: str
    value: float

class SensorDataRaw(BaseModel):
    sensor: str
    data: List[FieldValueRaw]

class BulkSensorDataItem(BaseModel):
    timestamp: datetime
    source_id: UUID
    sensors: List[SensorDataRaw]

class MonitoringSensorDataBulkRequest(BaseModel):
    items: List[BulkSensorDataItem]
