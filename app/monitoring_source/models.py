from sqlalchemy import Column, Text, Integer, DateTime, ForeignKey, text, Date, Float
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import DBBase
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Source(DBBase):
    __tablename__ = "mon_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mon_loc_id = Column(UUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"))
    source_name = Column(Text, nullable=True)
    folder_path = Column(Text, nullable=False)
    file_keyword = Column(Text, nullable=False)
    file_type = Column(Text, nullable=False)
    source_type = Column(Text, nullable=True)
    config = Column(Text, nullable=True)
    last_data_upload = Column(Text, nullable=True)
    active = Column(Integer, default=1)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mon_loc = relationship("MonLoc", back_populates="sources")


class MonLoc(DBBase):
    __tablename__ = "mon_loc"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    loc_number = Column(Text, nullable=True)
    loc_name = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    frequency = Column(Text, nullable=False)
    active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="mon_locs")
    sources = relationship("Source", back_populates="mon_loc")


class Project(DBBase):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    project_number = Column(Text, nullable=True)
    project_name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(Text, nullable=False)
    active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), server_default=func.now())

    mon_locs = relationship("MonLoc", back_populates="project")
