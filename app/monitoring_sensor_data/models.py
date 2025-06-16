from sqlalchemy import Column, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
from app.config.database import DBBase

class MonitoringSensorData(DBBase):
    __tablename__ = "mon_sensor_data"

    mon_loc_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"), nullable=False)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_sensors.id", ondelete="CASCADE"), nullable=False)
    sensor_field_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_sensor_fields.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    data = Column(Float, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
