from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_group.models import MonitoringGroup


def get_monitoring_group(db: Session, group_id: UUID) -> Optional[MonitoringGroup]:
    return db.query(MonitoringGroup).filter(MonitoringGroup.id == group_id).first()

def get_monitoring_groups(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoringGroup]:
    return db.query(MonitoringGroup).offset(skip).limit(limit).all()

def get_location_monitoring_groups(db: Session, location_id: UUID, skip: int = 0, limit: int = 100) -> List[MonitoringGroup]:
    return db.query(MonitoringGroup).filter(MonitoringGroup.mon_loc_id == location_id).offset(skip).limit(limit).all()