from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
from app.monitoring_sensor_data import schemas, selectors
from app.monitoring_sensor_data.models import MonitoringSensorData
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_sensor_fields.models import MonitoringSensorField
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
        mon_loc_id = entry.mon_loc_id
        for sensor_obj in entry.sensors:
            sensor_id = sensor_obj.sensor_id

            sensor = db.query(MonitoringSensor).filter_by(id=sensor_id, mon_source_id=source_id).first()
            if not sensor:
                raise HTTPException(status_code=400, detail=f"Invalid sensor id: {sensor_id}")

            payload = {
                "sensor_id": str(sensor.id),
                "mon_loc_id": str(mon_loc_id),
                "timestamp": timestamp.isoformat(),
                "fields": []
            }

            for field_val in sensor_obj.data:
                field_id = field_val.field_id
                value = field_val.value

                field = db.query(MonitoringSensorField).filter_by(id=field_id, sensor_id=sensor_id).first()
                if not field:
                    raise HTTPException(status_code=400, detail=f"Invalid field id {field_id} for sensor {sensor_id}")

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
