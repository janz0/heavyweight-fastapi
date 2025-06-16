from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.common.dependencies import get_db
from app.monitoring_sensor import schemas, selectors, services
from app.monitoring_sensor_fields import schemas as field_schemas, selectors as field_selectors, services as field_services

router = APIRouter(prefix="/monitoring-sensors", tags=["Monitoring Sensors"])

@router.post("/", response_model=schemas.MonitoringSensor, status_code=status.HTTP_201_CREATED)
def create_monitoring_sensor(
    payload: schemas.MonitoringSensorCreate,
    db: Session = Depends(get_db),
):
    return services.create_monitoring_sensor(db, payload)

@router.get("/", response_model=List[schemas.MonitoringSensor])
def list_monitoring_sensors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return selectors.get_monitoring_sensors(db, skip=skip, limit=limit)

@router.get("/{sensor_id}", response_model=schemas.MonitoringSensor)
def get_monitoring_sensor(sensor_id: UUID, db: Session = Depends(get_db)):
    obj = selectors.get_monitoring_sensor(db, sensor_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensor not found")
    return obj

@router.patch("/{sensor_id}", response_model=schemas.MonitoringSensor)
def update_monitoring_sensor(
    sensor_id: UUID,
    payload: schemas.MonitoringSensorUpdate,
    db: Session = Depends(get_db),
):
    obj = services.update_monitoring_sensor(db, sensor_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensor not found")
    return obj

@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_sensor(sensor_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_monitoring_sensor(db, sensor_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "MonitoringSensor not found")
    services.delete_monitoring_sensor(db, sensor_id)


@router.post("/{sensor_id}/field", response_model=field_schemas.MonitoringSensorField, status_code=status.HTTP_201_CREATED)
def create_sensor_field(sensor_id: UUID, payload: field_schemas.MonitoringSensorFieldCreate, db: Session = Depends(get_db)):
    return field_services.create_sensor_field(db, sensor_id, payload)


@router.get("/{sensor_id}/fields", response_model=List[field_schemas.MonitoringSensorField])
def list_sensor_fields(sensor_id: UUID, db: Session = Depends(get_db)):
    return field_selectors.get_sensor_fields(db, sensor_id)


@router.get("/fields/{field_id}", response_model=field_schemas.MonitoringSensorField)
def get_sensor_field(field_id: UUID, db: Session = Depends(get_db)):
    obj = field_selectors.get_sensor_field(db, field_id)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sensor field not found")
    return obj


@router.patch("/fields/{field_id}", response_model=field_schemas.MonitoringSensorField)
def update_sensor_field(field_id: UUID, payload: field_schemas.MonitoringSensorFieldUpdate, db: Session = Depends(get_db)):
    obj = field_services.update_sensor_field(db, field_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sensor field not found")
    return obj


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sensor_field(field_id: UUID, db: Session = Depends(get_db)):
    if not field_selectors.get_sensor_field(db, field_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Sensor field not found")
    field_services.delete_sensor_field(db, field_id)
