from sqlalchemy import Column, Text, Float, Integer, DateTime, text, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase
from sqlalchemy.orm import relationship

class MonitoringSensorField(DBBase):
    __tablename__ = "mon_sensor_fields"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    sensor_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_sensors.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(Text, nullable=False)
    uom = Column(Text, nullable=True)
    is_calculated = Column(Boolean, server_default=text("false"), nullable=False)
    field_type = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("sensor_id", "field_name", name="uq_sensor_fieldname"),
    )

    sensor = relationship(
        "MonitoringSensor",
        back_populates="fields"
    )
