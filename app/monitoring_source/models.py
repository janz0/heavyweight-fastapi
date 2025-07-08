from sqlalchemy import Column, Text, Integer, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.monitoring_sensor.models import MonitoringSensor

class Source(DBBase):
    __tablename__ = "mon_sources"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    mon_loc_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"), nullable=False)
    source_name = Column(Text, nullable=True)
    folder_path = Column(Text, nullable=False)
    file_keyword = Column(Text, nullable=False)
    file_type = Column(Text, nullable=False)
    source_type = Column(Text, nullable=True)
    config = Column(Text, nullable=True)
    last_data_upload = Column(Text, nullable=True)
    active = Column(Integer, default=1)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    root_directory = Column(Text, nullable=True)

    # reciprocal side of the relationship
    mon_loc = relationship(
        "Location",
        back_populates="mon_sources",
    )

    mon_sensors = relationship(MonitoringSensor, back_populates="mon_source", lazy="selectin")