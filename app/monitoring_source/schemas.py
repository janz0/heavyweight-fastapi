from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class SourceBase(BaseModel):
    mon_loc_id: Optional[UUID]
    source_name: Optional[str]
    folder_path: str
    file_keyword: str
    file_type: str
    source_type: Optional[str]
    config: Optional[str]
    last_data_upload: Optional[str]
    active: Optional[int] = 1

class SourceCreate(SourceBase):
    pass

class SourceUpdate(BaseModel):
    mon_loc_id: Optional[UUID]
    source_name: Optional[str]
    folder_path: Optional[str]
    file_keyword: Optional[str]
    file_type: Optional[str]
    source_type: Optional[str]
    config: Optional[str]
    last_data_upload: Optional[str]
    active: Optional[int]

class SourceMetadata(BaseModel):
    loc_number: Optional[str]
    loc_name: str
    project_id: UUID
    project_number: Optional[str]
    project_name: str

    class Config:
        orm_mode = True

class Source(SourceBase):
    id: int
    last_updated: datetime
    metadata: Optional[SourceMetadata]

    class Config:
        orm_mode = True

