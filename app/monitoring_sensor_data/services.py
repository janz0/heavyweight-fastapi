from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
from app.monitoring_sensor_data import schemas, selectors
from app.monitoring_sensor_data.models import MonitoringSensorData
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_sensor_fields import models as MonitoringSensorField
from app.kafka_producer import send_kafka_message  # use this

KAFKA_TOPIC = "sensor.readings"

def create_monitoring_sensor_data(db: Session, payload: schemas.MonitoringSensorDataCreate) -> MonitoringSensorData:
    obj = MonitoringSensorData(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_monitoring_sensor_data(db: Session, sensor_field_id: UUID, timestamp: datetime, payload: schemas.MonitoringSensorDataUpdate) -> MonitoringSensorData:
    obj = selectors.get_monitoring_sensor_data_entry(db, sensor_field_id, timestamp)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_monitoring_sensor_data(db: Session, sensor_field_id: UUID, timestamp: datetime) -> None:
    obj = selectors.get_monitoring_sensor_data_entry(db, sensor_field_id, timestamp)
    if obj:
        db.delete(obj)
        db.commit()

def create_bulk_sensor_data_from_source(db: Session, request: schemas.MonitoringSensorDataBulkRequest):
    produced = 0

    for entry in request.items:
        source_id = entry.source_id
        timestamp = entry.timestamp

        for sensor_obj in entry.sensors:
            sensor_name = sensor_obj.sensor

            sensor = db.query(MonitoringSensor).filter_by(source_id=source_id, name=sensor_name).first()
            if not sensor:
                raise HTTPException(status_code=404, detail=f"Sensor '{sensor_name}' not found for source {source_id}")

            fields = {
                f.field_name: f
                for f in db.query(MonitoringSensorField).filter_by(sensor_id=sensor.id).all()
            }

            payload = {
                "sensor_id": str(sensor.id),
                "mon_loc_id": str(sensor.mon_loc_id),
                "timestamp": timestamp.isoformat(),
                "fields": []
            }

            for field_val in sensor_obj.data:
                field_name = field_val.field
                value = field_val.value

                if field_name not in fields:
                    raise HTTPException(status_code=404, detail=f"Field '{field_name}' not found for sensor '{sensor_name}'")

                field = fields[field_name]
                payload["fields"].append({
                    "field_id": str(field.id),
                    "value": value
                })

            send_kafka_message(
                topic=KAFKA_TOPIC,
                key=str(sensor.id),
                value=payload
            )

            produced += 1

    return {"status": "enqueued", "records_enqueued": produced}
