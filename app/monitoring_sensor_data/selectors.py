from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
from uuid import UUID

from app.monitoring_sensor_data.models import MonitoringSensorData
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_sensor_fields.models import MonitoringSensorField
from app.monitoring_group.models import MonitoringGroup
from app.monitoring_source.models import Source
from app.location.models import Location
from app.project.models import Project

def get_monitoring_sensor_data_entry(db: Session, sensor_field_id: UUID, timestamp: datetime) -> Optional[MonitoringSensorData]:
    return db.query(MonitoringSensorData).filter(
        MonitoringSensorData.sensor_field_id == sensor_field_id,
        MonitoringSensorData.timestamp == timestamp
    ).first()

def get_monitoring_sensor_data_list(db: Session, skip: int = 0, limit: int = 100) -> List[MonitoringSensorData]:
    return db.query(MonitoringSensorData).offset(skip).limit(limit).all()


def query_monitoring_sensor_data(
    db: Session,
    *,
    project_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    sensor_id: Optional[UUID] = None,
    project_name: Optional[str] = None,
    location_name: Optional[str] = None,
    sensor_name: Optional[str] = None,
    sensor_type: Optional[str] = None,
    sensor_group_id: Optional[UUID] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    aggregate_period: Optional[str] = None,
    trim_low: Optional[float] = None,
    trim_high: Optional[float] = None,
    include_field_name: bool = False,
) -> List:
    """Query sensor data with optional filters and aggregation."""

    q = db.query(MonitoringSensorData)
    q = q.join(MonitoringSensor, MonitoringSensorData.sensor_id == MonitoringSensor.id)
    q = q.join(MonitoringSensorField, MonitoringSensorData.sensor_field_id == MonitoringSensorField.id)
    q = q.join(Source, MonitoringSensor.mon_source_id == Source.id)
    q = q.join(Location, Source.mon_loc_id == Location.id)
    q = q.join(Project, Location.project_id == Project.id)
    q = q.outerjoin(MonitoringGroup, MonitoringSensor.sensor_group_id == MonitoringGroup.id)

    if project_id:
        q = q.filter(Project.id == project_id)
    if project_name:
        q = q.filter(Project.project_name == project_name)
    if location_id:
        q = q.filter(Location.id == location_id)
    if location_name:
        q = q.filter(Location.loc_name == location_name)
    if sensor_id:
        q = q.filter(MonitoringSensor.id == sensor_id)
    if sensor_name:
        q = q.filter(MonitoringSensor.sensor_name == sensor_name)
    if sensor_type:
        q = q.filter(MonitoringSensor.sensor_type == sensor_type)
    if sensor_group_id:
        q = q.filter(MonitoringGroup.id == sensor_group_id)
    if start:
        q = q.filter(MonitoringSensorData.timestamp >= start)
    if end:
        q = q.filter(MonitoringSensorData.timestamp <= end)

    if trim_low is not None or trim_high is not None:
        lp = (trim_low or 0) / 100
        hp = (trim_high or 100) / 100
        bounds = (
            q.with_entities(
                MonitoringSensorData.sensor_id.label("s_id"),
                MonitoringSensorData.sensor_field_id.label("f_id"),
                func.percentile_cont(lp).within_group(MonitoringSensorData.data).label("low_val"),
                func.percentile_cont(hp).within_group(MonitoringSensorData.data).label("high_val"),
            )
            .group_by(MonitoringSensorData.sensor_id, MonitoringSensorData.sensor_field_id)
            .subquery()
        )
        q = q.join(
            bounds,
            and_(
                bounds.c.s_id == MonitoringSensorData.sensor_id,
                bounds.c.f_id == MonitoringSensorData.sensor_field_id,
            ),
        )
        q = q.filter(
            MonitoringSensorData.data >= bounds.c.low_val,
            MonitoringSensorData.data <= bounds.c.high_val,
        )

    if aggregate_period:
        ts = func.date_trunc(aggregate_period, MonitoringSensorData.timestamp).label("timestamp")
        columns = [
            ts,
            MonitoringSensorData.sensor_id,
            MonitoringSensorData.sensor_field_id,
            func.avg(MonitoringSensorData.data).label("data"),
        ]
        if include_field_name:
            columns.append(MonitoringSensorField.field_name.label("field_name"))
        q = (
            q.with_entities(*columns)
            .group_by(ts, MonitoringSensorData.sensor_id, MonitoringSensorData.sensor_field_id, *( [MonitoringSensorField.field_name] if include_field_name else [] ))
            .order_by(ts)
        )
    else:
        columns = [
            MonitoringSensorData.timestamp.label("timestamp"),
            MonitoringSensorData.sensor_id,
            MonitoringSensorData.sensor_field_id,
            MonitoringSensorData.data.label("data"),
        ]
        if include_field_name:
            columns.append(MonitoringSensorField.field_name.label("field_name"))
        q = q.with_entities(*columns).order_by(MonitoringSensorData.timestamp)

    return q.all()
