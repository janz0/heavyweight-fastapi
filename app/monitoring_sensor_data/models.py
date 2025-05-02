from sqlalchemy import Column, Integer, Boolean, DateTime, text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.sql import func
from app.config.database import DBBase

class MonitoringSensorData(DBBase):
    __tablename__ = "mon_sensor_data"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime(timezone=True), primary_key=True, server_default=func.now())
    mon_loc_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"), nullable=False)
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_sensors.id", ondelete="CASCADE"), nullable=False)
    data = Column(JSONB, nullable=False)
    is_processed = Column(Boolean, nullable=False, default=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)