from __future__ import annotations
from datetime import datetime
from uuid import UUID
from typing import Optional, Union, List, Literal

from pydantic import BaseModel, Field

#
# ─── TEMPLATE ────────────────────────────────────────────────────────────────
#
class ChecklistTemplateBase(BaseModel):
    project_id: Optional[UUID] = None
    name: str


class ChecklistTemplateCreate(ChecklistTemplateBase):
    pass


class ChecklistTemplateRead(ChecklistTemplateBase):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True


#
# ─── CATEGORY ────────────────────────────────────────────────────────────────
#
class ChecklistTemplateCategoryBase(BaseModel):
    template_id: UUID
    title: str
    sort_order: int = Field(..., ge=0)


class ChecklistTemplateCategoryCreate(ChecklistTemplateCategoryBase):
    pass


class ChecklistTemplateCategoryRead(ChecklistTemplateCategoryBase):
    id: UUID

    class Config:
        orm_mode = True


#
# ─── ITEM ────────────────────────────────────────────────────────────────────
#
class ChecklistTemplateItemBase(BaseModel):
    category_id: UUID
    prompt: str
    response_type: str  # e.g. "yes_no" or "text"
    sort_order: int = Field(..., ge=0)


class ChecklistTemplateItemCreate(ChecklistTemplateItemBase):
    pass


class ChecklistTemplateItemRead(ChecklistTemplateItemBase):
    id: UUID

    class Config:
        orm_mode = True


#
# ─── CHECKLIST INSTANCE ──────────────────────────────────────────────────────
#
class ChecklistBase(BaseModel):
    location_id: UUID
    template_id: UUID
    performed_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    notes: Optional[str] = None


class ChecklistCreate(ChecklistBase):
    pass


class ChecklistRead(ChecklistBase):
    id: UUID
    performed_at: datetime

    class Config:
        orm_mode = True


#
# ─── RESPONSE ────────────────────────────────────────────────────────────────
#
class ChecklistResponseBase(BaseModel):
    checklist_id: UUID
    template_item_id: UUID
    value: Union[bool, str]
    comment: Optional[str] = None


class ChecklistResponseCreate(ChecklistResponseBase):
    pass


class ChecklistResponseRead(ChecklistResponseBase):
    id: UUID
    checklist_id: UUID
    template_item_id: UUID
    value: bool
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ChecklistItemRead(BaseModel):
    id: UUID
    prompt: str
    response_type: Literal["yes_no", "text"]
    sort_order: int

class ChecklistCategoryRead(BaseModel):
    id: UUID
    title: str
    sort_order: int
    items: List[ChecklistItemRead]

class ChecklistExpandedRead(BaseModel):
    id: UUID
    template_id: UUID
    template_name: str
    performed_at: datetime
    notes: Optional[str] = None
    categories: List[ChecklistCategoryRead]
    responses: List[ChecklistResponseRead]