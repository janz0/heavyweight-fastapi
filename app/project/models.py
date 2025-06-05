from sqlalchemy import Column, Text, Date, Integer, DateTime, text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import select
from app.location.models import Location

class Project(DBBase):
    __tablename__ = "projects"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    project_number = Column(Text, nullable=True)
    project_name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(Text, nullable=False)
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    mon_locs = relationship(
        Location,
        back_populates="project",
        lazy="selectin",
    )

    @hybrid_property
    def locations_count(self) -> int:
        return len(self.mon_locs)
    
    @locations_count.expression
    def locations_count(cls):
        return (
            select(func.count(Location.id))
            .where(Location.project_id == cls.id)
            .correlate(cls)
            .scalar_subquery()
        )