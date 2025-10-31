from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_sensor_data import schemas, selectors, services

router = APIRouter(prefix="/monitoring-sensor-data", tags=["Monitoring Sensor Data"])

@router.post("/", response_model=schemas.MonitoringSensorData, status_code=status.HTTP_201_CREATED)
def create_monitoring_sensor_data(
    payload: schemas.MonitoringSensorDataCreate,
    db: Session = Depends(get_db),
):
    return services.create_monitoring_sensor_data(db, payload)

@router.get("/", response_model=List[schemas.MonitoringSensorData])
def list_monitoring_sensor_data(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_monitoring_sensor_data_list(db, skip=skip, limit=limit)


def _parse_csv_values(value: Optional[str]) -> Optional[List[str]]:
    if value is None:
        return None
    items = [item.strip() for item in value.split(",")]
    items = [item for item in items if item]
    return items or None


def _parse_uuid_csv(value: Optional[str]) -> Optional[List[UUID]]:
    items = _parse_csv_values(value)
    if not items:
        return None
    try:
        return [UUID(item) for item in items]
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


def _query_data(
    *,
    project_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    sensor_id: Optional[UUID] = None,
    project_number: Optional[str] = None,
    location_number: Optional[str] = None,
    sensor_name: Optional[str] = None,
    sensor_type: Optional[str] = None,
    sensor_group_id: Optional[UUID] = None,
    source_ids: Optional[str] = None,
    source_names: Optional[str] = None,
    field_name: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    aggregate_period: Optional[str] = None,
    trim_percentile_low: Optional[float] = None,
    trim_percentile_high: Optional[float] = None,
    include_field_name: bool = False,
    output: str = "json",
    db: Session,
):
    parsed_source_ids = _parse_uuid_csv(source_ids)
    parsed_source_names = _parse_csv_values(source_names)

    rows = selectors.query_monitoring_sensor_data(
        db,
        project_id=project_id,
        location_id=location_id,
        sensor_id=sensor_id,
        project_number=project_number,
        location_number=location_number,
        sensor_name=sensor_name,
        sensor_type=sensor_type,
        sensor_group_id=sensor_group_id,
        source_ids=parsed_source_ids,
        source_names=parsed_source_names,
        field_name=field_name,
        start=start,
        end=end,
        aggregate_period=aggregate_period,
        trim_low=trim_percentile_low,
        trim_high=trim_percentile_high,
        include_field_name=include_field_name,
    )

    def row_to_dict(r):
        return dict(r._mapping)

    data = [row_to_dict(r) for r in rows]

    if include_field_name:
        grouped = {}
        for item in data:
            key = (item["timestamp"], item["sensor_id"])
            rec = grouped.setdefault(
                key,
                {
                    "timestamp": item["timestamp"],
                    "sensor_id": item["sensor_id"],
                    "sensor_name": item.get("sensor_name"),
                    "project_number": item.get("project_number"),
                    "project_name": item.get("project_name"),
                    "location_number": item.get("location_number"),
                    "location_name": item.get("location_name"),
                },
            )
            rec[item["field_name"]] = item["data"]
        data = list(grouped.values())

    if output == "csv":
        import csv
        from io import StringIO

        if not data:
            return Response(content="", media_type="text/csv")
        f = StringIO()
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        return Response(content=f.getvalue(), media_type="text/csv")

    return data


@router.get("/query-by-field")
def query_monitoring_sensor_data(
    project_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    sensor_id: Optional[UUID] = None,
    project_number: Optional[str] = None,
    location_number: Optional[str] = None,
    sensor_name: Optional[str] = None,
    sensor_type: Optional[str] = None,
    sensor_group_id: Optional[UUID] = None,
    source_ids: Optional[str] = None,
    source_names: Optional[str] = None,
    field_name: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    aggregate_period: Optional[str] = None,
    trim_percentile_low: Optional[float] = None,
    trim_percentile_high: Optional[float] = None,
    output: str = "json",
    db: Session = Depends(get_db),
):
    return _query_data(
        project_id=project_id,
        location_id=location_id,
        sensor_id=sensor_id,
        project_number=project_number,
        location_number=location_number,
        sensor_name=sensor_name,
        sensor_type=sensor_type,
        sensor_group_id=sensor_group_id,
        source_ids=source_ids,
        source_names=source_names,
        field_name=field_name,
        start=start,
        end=end,
        aggregate_period=aggregate_period,
        trim_percentile_low=trim_percentile_low,
        trim_percentile_high=trim_percentile_high,
        include_field_name=True,
        output=output,
        db=db,
    )


@router.get("/query-by-sensor")
def query_sensor_pivot(
    project_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    sensor_id: Optional[UUID] = None,
    project_number: Optional[str] = None,
    location_number: Optional[str] = None,
    sensor_name: Optional[str] = None,
    sensor_type: Optional[str] = None,
    sensor_group_id: Optional[UUID] = None,
    source_ids: Optional[str] = None,
    source_names: Optional[str] = None,
    field_name: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    aggregate_period: Optional[str] = None,
    trim_percentile_low: Optional[float] = None,
    trim_percentile_high: Optional[float] = None,
    output: str = "json",
    db: Session = Depends(get_db),
):
    return _query_data(
        project_id=project_id,
        location_id=location_id,
        sensor_id=sensor_id,
        project_number=project_number,
        location_number=location_number,
        sensor_name=sensor_name,
        sensor_type=sensor_type,
        sensor_group_id=sensor_group_id,
        source_ids=source_ids,
        source_names=source_names,
        field_name=field_name,
        start=start,
        end=end,
        aggregate_period=aggregate_period,
        trim_percentile_low=trim_percentile_low,
        trim_percentile_high=trim_percentile_high,
        include_field_name=True,
        output=output,
        db=db,
    )

@router.get("/{sensor_field_id}/{timestamp}", response_model=schemas.MonitoringSensorData)
def get_monitoring_sensor_data(sensor_field_id: UUID, timestamp: datetime, db: Session = Depends(get_db)):
    obj = selectors.get_monitoring_sensor_data_entry(db, sensor_field_id, timestamp)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    return obj

@router.patch("/{sensor_field_id}/{timestamp}", response_model=schemas.MonitoringSensorData)
def update_monitoring_sensor_data(sensor_field_id: UUID, timestamp: datetime, payload: schemas.MonitoringSensorDataUpdate, db: Session = Depends(get_db)):
    obj = services.update_monitoring_sensor_data(db, sensor_field_id, timestamp, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    return obj

@router.delete("/{sensor_field_id}/{timestamp}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_sensor_data(sensor_field_id: UUID, timestamp: datetime, db: Session = Depends(get_db)):
    if not selectors.get_monitoring_sensor_data_entry(db, sensor_field_id, timestamp):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensorData not found")
    services.delete_monitoring_sensor_data(db, sensor_field_id, timestamp)

@router.post("/bulk-from-source", status_code=201)
def create_bulk_sensor_data_from_source(
    payload: schemas.MonitoringSensorDataBulkRequest,
    db: Session = Depends(get_db),
):
    return services.create_bulk_sensor_data_from_source(db, payload)
