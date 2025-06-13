from sqlalchemy import Column, Text, Integer, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.sql import func
from app.config.database import DBBase
from sqlalchemy.orm import relationship
from app.monitoring_sensor.models import MonitoringSensor

class MonitoringGroup(DBBase):
    __tablename__ = "mon_loc_groups"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    mon_loc_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"), nullable=False)
    group_name = Column(Text, nullable=False)
    group_type = Column(Text, nullable=False)
    data = Column(JSONB, nullable=True)
    status = Column(Text, nullable=False, server_default=text("'Created'"))
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    mon_loc = relationship(
        "Location",
        back_populates="mon_loc_groups"
    )

    mon_sensors = relationship(MonitoringSensor, back_populates="mon_loc_group", lazy="selectin")

