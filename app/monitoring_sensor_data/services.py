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
        sensor_type = entry.sensor_type

        for sensor_obj in entry.sensors:
            sensor_name = sensor_obj.sensor

            sensor = db.query(MonitoringSensor).filter_by(mon_source_id=source_id, sensor_name=sensor_name).first()
            if not sensor:
                sensor = MonitoringSensor(
                    mon_source_id=source_id,
                    sensor_name=sensor_name,
                    sensor_type=sensor_type
                )
                db.add(sensor)
                db.commit()
                db.refresh(sensor)

            fields = {
                f.field_name: f
                for f in db.query(MonitoringSensorField).filter_by(sensor_id=sensor.id).all()
            }

            payload = {
                "sensor_id": str(sensor.id),
                "mon_loc_id": str(mon_loc_id),
                "timestamp": timestamp.isoformat(),
                "fields": []
            }

            for field_val in sensor_obj.data:
                field_name = field_val.field
                value = field_val.value

                if field_name not in fields:
                    # Auto-create field if missing
                    new_field = MonitoringSensorField(
                        sensor_id=sensor.id,
                        field_name=field_name,
                        uom=None,
                        is_calculated=False,
                        field_type=None
                    )
                    db.add(new_field)
                    db.commit()
                    db.refresh(new_field)
                    fields[field_name] = new_field

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
