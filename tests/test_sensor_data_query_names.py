import uuid
from datetime import date, datetime

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
    project = Project(id=uuid.uuid4(), project_number="P1", project_name="Proj", start_date=date.today(), status="active")
    db.add(project)
    db.commit()
    db.refresh(project)
    location = Location(id=uuid.uuid4(), project_id=project.id, loc_number="L1", loc_name="Loc", lat=0.0, lon=0.0, frequency="daily")
    db.add(location)
    db.commit()
    db.refresh(location)
    source = Source(id=uuid.uuid4(), mon_loc_id=location.id, folder_path="fp", file_keyword="kw", file_type="csv")
    db.add(source)
    db.commit()
    db.refresh(source)
    sensor = MonitoringSensor(id=uuid.uuid4(), mon_source_id=source.id, sensor_name="s1", sensor_type="analog")
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    field = MonitoringSensorField(id=uuid.uuid4(), sensor_id=sensor.id, field_name="temp")
    db.add(field)
    db.commit()
    db.refresh(field)
    data = MonitoringSensorData(mon_loc_id=location.id, sensor_id=sensor.id, sensor_field_id=field.id, timestamp=datetime.utcnow(), data=1.23)
    db.add(data)
    db.commit()
    db.refresh(data)
    return sensor, field, data


def test_query_includes_names(client, db):
    sensor, field, data = setup_sensor_data(db)
    resp = client.get(
        "/monitoring-sensor-data/query-by-field",
        params={"sensor_id": str(sensor.id)}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body
    item = body[0]
    assert item["sensor_name"] == "s1"
    assert item["project_name"] == "Proj"
    assert item["location_name"] == "Loc"
