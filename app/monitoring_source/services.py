from typing import Optional, List, Union
from app.monitoring_source.models import Source
from app.monitoring_source import schemas, selectors
from app.monitoring_sensor_fields.schemas import (
    MonitoringSensorField,
    MonitoringSensorFieldName,
)
from sqlalchemy.orm import Session
from uuid import UUID
from app.monitoring_sensor import services as sensor_services

def create_source(db: Session, payload: schemas.SourceCreate) -> Source:
    obj = Source(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_source(db: Session, source_id: UUID, payload: schemas.SourceUpdate) -> Optional[Source]:
    obj = selectors.get_source(db, source_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_source(db: Session, source_id: UUID) -> None:
    obj = selectors.get_source(db, source_id)
    if obj:
        db.delete(obj)
        db.commit()

def enrich_source(
    source: Source,
    children: bool = False,
    minimal: bool = False,
) -> Union[schemas.Source, schemas.SourceWithSensors, schemas.SourceWithSensorNames]:
    details = None
    if source.mon_loc and source.mon_loc.project:
        details = schemas.SourceMetadata(
            loc_number=source.mon_loc.loc_number,
            loc_name=source.mon_loc.loc_name,
            project_id=source.mon_loc.project.id,
            project_number=source.mon_loc.project.project_number,
            project_name=source.mon_loc.project.project_name,
        )

    # Bypass validation because we already know the model is valid
    source_dict = dict(source.__dict__)
    source_dict["details"] = details

    if children:
        sensors: List = []
        for sensor in source.mon_sensors:
            if minimal:
                fields = [
                    MonitoringSensorFieldName.model_construct(**f.__dict__)
                    for f in sensor.fields
                ]
                sensor_model = schemas.MonitoringSensorNameWithFields(
                    id=sensor.id,
                    sensor_name=sensor.sensor_name,
                    fields=fields,
                )
            else:
                base_model = sensor_services.enrich_sensor(sensor)
                sensor_model = schemas.MonitoringSensorWithFields(
                    **base_model.model_dump(),
                    fields=[
                        MonitoringSensorField.model_construct(**f.__dict__)
                        for f in sensor.fields
                    ],
                )
            sensors.append(sensor_model)
        source_dict["sensors"] = sensors
        if minimal:
            return schemas.SourceWithSensorNames.model_construct(**source_dict)
        return schemas.SourceWithSensors.model_construct(**source_dict)

    return schemas.Source.model_construct(**source_dict)
