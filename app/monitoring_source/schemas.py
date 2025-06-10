from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

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

class SourceMetadata(BaseModel):
    loc_number: Optional[str] = None
    loc_name: str
    project_id: UUID
    project_number: Optional[str] = None
    project_name: str

    class Config:
        from_attributes  = True

class Source(SourceBase):
    id: int
    last_updated: datetime
    details: Optional[SourceMetadata] = None

    class Config:
        from_attributes  = True

