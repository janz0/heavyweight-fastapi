from sqlalchemy import Column, Text, Float, Integer, DateTime, text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from app.config.database import DBBase
from app.monitoring_source.models import Source
from app.monitoring_group.models import MonitoringGroup

class Location(DBBase):
    __tablename__ = "mon_loc"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    project_id = Column(PGUUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    loc_number = Column(Text, nullable=True)
    loc_name = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    frequency = Column(Text, nullable=False)
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship(
        "Project",
        back_populates="mon_locs"
    )

    mon_sources = relationship(Source, back_populates="mon_loc", lazy="selectin")
    mon_loc_groups = relationship(MonitoringGroup, back_populates="mon_loc", lazy="selectin")
