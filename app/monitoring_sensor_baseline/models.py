from sqlalchemy import Column, Float, Integer, DateTime, text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase

class MonitoringSensorBaseline(DBBase):
    __tablename__ = "mon_sensor_baselines"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_sensors.id", ondelete="CASCADE"), nullable=False)
    baseline_value = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)