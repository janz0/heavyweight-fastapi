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
    project_number: Optional[str] = None,
    location_number: Optional[str] = None,
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
    if project_number:
        q = q.filter(Project.project_number == project_number)
    if location_id:
        q = q.filter(Location.id == location_id)
    if location_number:
        q = q.filter(Location.loc_number == location_number)
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

        # Collect base filters so the same restrictions are applied to the
        # percentile calculation subquery.
        base_filters = []
        if project_id:
            base_filters.append(Project.id == project_id)
        if project_number:
            base_filters.append(Project.project_number == project_number)
        if location_id:
            base_filters.append(Location.id == location_id)
        if location_number:
            base_filters.append(Location.loc_number == location_number)
        if sensor_id:
            base_filters.append(MonitoringSensor.id == sensor_id)
        if sensor_name:
            base_filters.append(MonitoringSensor.sensor_name == sensor_name)
        if sensor_type:
            base_filters.append(MonitoringSensor.sensor_type == sensor_type)
        if sensor_group_id:
            base_filters.append(MonitoringGroup.id == sensor_group_id)
        if start:
            base_filters.append(MonitoringSensorData.timestamp >= start)
        if end:
            base_filters.append(MonitoringSensorData.timestamp <= end)

        if aggregate_period:
            ts_group = func.date_trunc(aggregate_period, MonitoringSensorData.timestamp)
            pct_sub = (
                db.query(
                    MonitoringSensorData.sensor_id.label("sensor_id"),
                    MonitoringSensorData.sensor_field_id.label("sensor_field_id"),
                    ts_group.label("ts"),
                    func.percentile_cont(lp).within_group(MonitoringSensorData.data).label("low"),
                    func.percentile_cont(hp).within_group(MonitoringSensorData.data).label("high"),
                )
                .join(MonitoringSensor, MonitoringSensorData.sensor_id == MonitoringSensor.id)
                .join(MonitoringSensorField, MonitoringSensorData.sensor_field_id == MonitoringSensorField.id)
                .join(Source, MonitoringSensor.mon_source_id == Source.id)
                .join(Location, Source.mon_loc_id == Location.id)
                .join(Project, Location.project_id == Project.id)
                .outerjoin(MonitoringGroup, MonitoringSensor.sensor_group_id == MonitoringGroup.id)
                .filter(*base_filters)
                .group_by(MonitoringSensorData.sensor_id, MonitoringSensorData.sensor_field_id, ts_group)
                .subquery()
            )

            q = q.join(
                pct_sub,
                and_(
                    MonitoringSensorData.sensor_id == pct_sub.c.sensor_id,
                    MonitoringSensorData.sensor_field_id == pct_sub.c.sensor_field_id,
                    ts_group == pct_sub.c.ts,
                ),
            )
            q = q.filter(
                MonitoringSensorData.data >= pct_sub.c.low,
                MonitoringSensorData.data <= pct_sub.c.high,
            )
        else:
            pct_sub = (
                db.query(
                    MonitoringSensorData.sensor_id.label("sensor_id"),
                    MonitoringSensorData.sensor_field_id.label("sensor_field_id"),
                    func.percentile_cont(lp).within_group(MonitoringSensorData.data).label("low"),
                    func.percentile_cont(hp).within_group(MonitoringSensorData.data).label("high"),
                )
                .join(MonitoringSensor, MonitoringSensorData.sensor_id == MonitoringSensor.id)
                .join(MonitoringSensorField, MonitoringSensorData.sensor_field_id == MonitoringSensorField.id)
                .join(Source, MonitoringSensor.mon_source_id == Source.id)
                .join(Location, Source.mon_loc_id == Location.id)
                .join(Project, Location.project_id == Project.id)
                .outerjoin(MonitoringGroup, MonitoringSensor.sensor_group_id == MonitoringGroup.id)
                .filter(*base_filters)
                .group_by(MonitoringSensorData.sensor_id, MonitoringSensorData.sensor_field_id)
                .subquery()
            )

            q = q.join(
                pct_sub,
                and_(
                    MonitoringSensorData.sensor_id == pct_sub.c.sensor_id,
                    MonitoringSensorData.sensor_field_id == pct_sub.c.sensor_field_id,
                ),
            )
            q = q.filter(
                MonitoringSensorData.data >= pct_sub.c.low,
                MonitoringSensorData.data <= pct_sub.c.high,
            )

    if aggregate_period:
        ts = func.date_trunc(aggregate_period, MonitoringSensorData.timestamp).label("timestamp")
        columns = [
            ts,
            Project.project_number.label("project_number"),
            Project.project_name.label("project_name"),
            Location.loc_number.label("location_number"),
            Location.loc_name.label("location_name"),
            MonitoringSensor.id.label("sensor_id"),
            MonitoringSensor.sensor_name.label("sensor_name"),
            MonitoringSensorField.id.label("sensor_field_id"),
            func.avg(MonitoringSensorData.data).label("data"),
        ]
        group_by_cols = [
            ts,
            Project.project_number,
            Project.project_name,
            Location.loc_number,
            Location.loc_name,
            MonitoringSensor.id,
            MonitoringSensor.sensor_name,
            MonitoringSensorField.id,
        ]
        if include_field_name:
            columns.append(MonitoringSensorField.field_name.label("field_name"))
            group_by_cols.append(MonitoringSensorField.field_name)
        q = (
            q.with_entities(*columns)
            .group_by(*group_by_cols)
            .order_by(ts)
        )
    else:
        columns = [
            MonitoringSensorData.timestamp.label("timestamp"),
            Project.project_number.label("project_number"),
            Project.project_name.label("project_name"),
            Location.loc_number.label("location_number"),
            Location.loc_name.label("location_name"),
            MonitoringSensor.id.label("sensor_id"),
            MonitoringSensor.sensor_name.label("sensor_name"),
            MonitoringSensorField.id.label("sensor_field_id"),
            MonitoringSensorData.data.label("data"),
        ]
        if include_field_name:
            columns.append(MonitoringSensorField.field_name.label("field_name"))
        q = q.with_entities(*columns).order_by(MonitoringSensorData.timestamp)

    return q.all()
