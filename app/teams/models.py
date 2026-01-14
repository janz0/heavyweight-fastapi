# app/teams/models.py

from sqlalchemy import Column, Text, DateTime, text, select, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from app.config.database import DBBase


class Team(DBBase):
    __tablename__ = "teams"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    org = relationship("Organization", lazy="selectin")
    members = relationship("TeamMember", back_populates="team", lazy="selectin", cascade="all, delete-orphan")

    @hybrid_property
    def members_count(self) -> int:
        return len(self.members)
    
    @members_count.expression
    def members_count(cls):
        from app.teams.models import TeamMember
        return (
            select(func.count(TeamMember.id))
            .where(TeamMember.team_id == cls.id)
            .correlate(cls)
            .scalar_subquery()
        )

class TeamMember(DBBase):
    __tablename__ = "team_members"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    team_id = Column(PGUUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Text, nullable=False, server_default=text("'member'"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_members")