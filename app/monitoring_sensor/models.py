from sqlalchemy import Column, Text, Float, Integer, DateTime, text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase
from sqlalchemy.orm import relationship
from app.monitoring_sensor_fields.models import MonitoringSensorField

class MonitoringSensor(DBBase):
    __tablename__ = "mon_sensors"

    __table_args__ = (
        UniqueConstraint("mon_source_id", "sensor_name", name="uq_source_sensorname"),
    )

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    mon_source_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_sources.id", ondelete="CASCADE"), nullable=False)
    sensor_group_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_loc_groups.id", ondelete="CASCADE"), nullable=True)
    sensor_name = Column(Text, nullable=False)
    sensor_type = Column(Text, nullable=False)
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    mon_source = relationship(
        "Source",
        back_populates="mon_sensors"
    )

    mon_loc_group = relationship(
        "MonitoringGroup",
        back_populates="mon_sensors"
    )

    fields = relationship(MonitoringSensorField, back_populates="sensor", cascade="all, delete-orphan")
