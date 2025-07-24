import uuid
from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.config.database import DBBase
from app.common.dependencies import get_db
from app.project.models import Project
from app.location.models import Location
from app.monitoring_source.models import Source
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_sensor_fields.models import MonitoringSensorField
from app.monitoring_sensor_data.models import MonitoringSensorData

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture()
def db():
    DBBase.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    DBBase.metadata.drop_all(bind=engine)

@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def setup_sensor_data(db):
    project = Project(id=uuid.uuid4(), project_name="P", start_date=date.today(), status="active")
    db.add(project)
    db.commit()
    db.refresh(project)
    location = Location(id=uuid.uuid4(), project_id=project.id, loc_name="L", lat=0.0, lon=0.0, frequency="daily")
    db.add(location)
    db.commit()
    db.refresh(location)
    source = Source(id=uuid.uuid4(), mon_loc_id=location.id, folder_path="fp", file_keyword="kw", file_type="csv")
    db.add(source)
    db.commit()
    db.refresh(source)
    sensor_a = MonitoringSensor(id=uuid.uuid4(), mon_source_id=source.id, sensor_name="a", sensor_type="analog")
    sensor_b = MonitoringSensor(id=uuid.uuid4(), mon_source_id=source.id, sensor_name="b", sensor_type="analog")
    db.add_all([sensor_a, sensor_b])
    db.commit()
    db.refresh(sensor_a)
    db.refresh(sensor_b)
    field_a = MonitoringSensorField(id=uuid.uuid4(), sensor_id=sensor_a.id, field_name="fa")
    field_b = MonitoringSensorField(id=uuid.uuid4(), sensor_id=sensor_b.id, field_name="fb")
    db.add_all([field_a, field_b])
    db.commit()
    db.refresh(field_a)
    db.refresh(field_b)
    base = datetime(2024, 1, 1)
    data = [
        MonitoringSensorData(
            mon_loc_id=location.id,
            sensor_id=sensor_b.id,
            sensor_field_id=field_b.id,
            timestamp=base,
            data=1.0,
        ),
        MonitoringSensorData(
            mon_loc_id=location.id,
            sensor_id=sensor_b.id,
            sensor_field_id=field_b.id,
            timestamp=base + timedelta(hours=1),
            data=2.0,
        ),
        MonitoringSensorData(
            mon_loc_id=location.id,
            sensor_id=sensor_a.id,
            sensor_field_id=field_a.id,
            timestamp=base + timedelta(hours=2),
            data=3.0,
        ),
        MonitoringSensorData(
            mon_loc_id=location.id,
            sensor_id=sensor_a.id,
            sensor_field_id=field_a.id,
            timestamp=base + timedelta(hours=3),
            data=4.0,
        ),
    ]
    db.add_all(data)
    db.commit()
    for d in data:
        db.refresh(d)
    return base, sensor_a, sensor_b


def test_query_sorted_by_sensor_and_timestamp(client, db):
    base, sensor_a, sensor_b = setup_sensor_data(db)
    resp = client.get("/monitoring-sensor-data/query-by-field")
    assert resp.status_code == 200
    body = resp.json()
    expected = [
        ("a", (base + timedelta(hours=2)).isoformat()),
        ("a", (base + timedelta(hours=3)).isoformat()),
        ("b", base.isoformat()),
        ("b", (base + timedelta(hours=1)).isoformat()),
    ]
    actual = [(item["sensor_name"], item["timestamp"]) for item in body]
    assert actual == expected


def test_query_sorted_with_aggregate(client, db):
    base, sensor_a, sensor_b = setup_sensor_data(db)
    resp = client.get("/monitoring-sensor-data/query-by-field", params={"aggregate_period": "hour"})
    assert resp.status_code == 200
    body = resp.json()
    expected = [
        ("a", (base + timedelta(hours=2)).isoformat()),
        ("a", (base + timedelta(hours=3)).isoformat()),
        ("b", base.isoformat()),
        ("b", (base + timedelta(hours=1)).isoformat()),
    ]
    actual = [(item["sensor_name"], item["timestamp"]) for item in body]
    assert actual == expected
