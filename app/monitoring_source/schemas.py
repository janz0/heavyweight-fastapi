from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.monitoring_sensor.schemas import (
    MonitoringSensorNameWithFields,
    MonitoringSensorWithFields,
)


class SourceBase(BaseModel):
    mon_loc_id: Optional[UUID] = None
    source_name: Optional[str] = None
    folder_path: str
    file_keyword: str
    file_type: str
    source_type: Optional[str] = None
    config: Optional[str] = None
    last_data_upload: Optional[str] = None
    active: Optional[int] = 1
    root_directory: Optional[str] = None


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    mon_loc_id: Optional[UUID] = None
    source_name: Optional[str] = None
    folder_path: Optional[str] = None
    file_keyword: Optional[str] = None
    file_type: Optional[str] = None
    source_type: Optional[str] = None
    config: Optional[str] = None
    last_data_upload: Optional[str] = None
    active: Optional[int] = None
    root_directory: Optional[str] = None


class SourceMetadata(BaseModel):
    loc_number: Optional[str] = None
    loc_name: str
    project_id: UUID
    project_number: Optional[str] = None
    project_name: str

    class Config:
        from_attributes = True


class Source(SourceBase):
    id: UUID
    last_updated: datetime
    details: Optional[SourceMetadata] = None

    class Config:
        from_attributes = True


class SourceWithSensors(Source):
    sensors: Optional[List[MonitoringSensorWithFields]] = None


class SourceWithSensorNames(Source):
    sensors: Optional[List[MonitoringSensorNameWithFields]] = None


class SourceLastUpdated(BaseModel):
    """Schema exposing only the id and last_updated fields of a Source."""

    id: UUID
    last_updated: datetime

    class Config:
        from_attributes = True
