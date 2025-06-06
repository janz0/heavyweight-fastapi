# app/checklists/models.py
from sqlalchemy import Column, ForeignKey, Text, Enum, Integer, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import DBBase

class ChecklistTemplate(DBBase):
    __tablename__ = "checklist_template"
    id         = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    project_id = Column(UUID(as_uuid=True), ForeignKey("project.id"), nullable=True)
    name       = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

class ChecklistTemplateCategory(DBBase):
    __tablename__ = "checklist_template_category"
    id          = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    template_id = Column(UUID(as_uuid=True), ForeignKey("checklist_template.id"), nullable=False)
    title       = Column(Text, nullable=False)
    sort_order  = Column(Integer, nullable=False)

class ChecklistTemplateItem(DBBase):
    __tablename__ = "checklist_template_item"
    id           = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    category_id  = Column(UUID(as_uuid=True), ForeignKey("checklist_template_category.id"), nullable=False)
    prompt       = Column(Text, nullable=False)
    response_type= Column(Enum("yes_no","text", name="response_type"), nullable=False)
    sort_order   = Column(Integer, nullable=False)

class Checklist(DBBase):
    __tablename__ = "checklist"
    id           = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    location_id  = Column(UUID(as_uuid=True), ForeignKey("mon_loc.id"), nullable=False)
    template_id  = Column(UUID(as_uuid=True), ForeignKey("checklist_template.id"), nullable=False)
    performed_at = Column(DateTime, nullable=False, server_default=func.now())
    created_by   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes        = Column(Text)

class ChecklistResponse(DBBase):
    __tablename__ = "checklist_response"
    id               = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    checklist_id     = Column(UUID(as_uuid=True), ForeignKey("checklist.id"), nullable=False)
    template_item_id = Column(UUID(as_uuid=True), ForeignKey("checklist_template_item.id"), nullable=False)
    value            = Column(Boolean, nullable=False)  # for yes/no, extend later for text
    comment          = Column(Text)
    created_at       = Column(DateTime, nullable=False, server_default=func.now())
