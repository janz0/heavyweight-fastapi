import uuid
from datetime import date

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


def create_dependencies(db):
    project = Project(id=uuid.uuid4(), project_name="P1", start_date=date.today(), status="active")
    db.add(project)
    db.commit()
    db.refresh(project)
    location = Location(id=uuid.uuid4(), project_id=project.id, loc_name="L1", lat=0.0, lon=0.0, frequency="daily")
    db.add(location)
    db.commit()
    db.refresh(location)
    source = Source(id=uuid.uuid4(), mon_loc_id=location.id, folder_path="fp", file_keyword="kw", file_type="csv")
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def test_duplicate_sensor_creation_returns_existing(client, db):
    src = create_dependencies(db)
    payload = {"mon_source_id": str(src.id), "sensor_name": "temp", "sensor_type": "analog"}
    r1 = client.post("/monitoring-sensors/", json=payload)
    assert r1.status_code == 201
    r2 = client.post("/monitoring-sensors/", json=payload)
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


def test_duplicate_field_creation_returns_existing(client, db):
    src = create_dependencies(db)
    sensor_payload = {"mon_source_id": str(src.id), "sensor_name": "temp", "sensor_type": "analog"}
    sensor = client.post("/monitoring-sensors/", json=sensor_payload).json()
    field_payload = {"field_name": "val", "uom": "C"}
    r1 = client.post(f"/monitoring-sensors/{sensor['id']}/field", json=field_payload)
    assert r1.status_code == 201
    r2 = client.post(f"/monitoring-sensors/{sensor['id']}/field", json=field_payload)
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


def test_sensor_creation_updates_source_timestamp(client, db):
    src = create_dependencies(db)
    before = src.last_updated
    payload = {"mon_source_id": str(src.id), "sensor_name": "temp", "sensor_type": "analog"}
    client.post("/monitoring-sensors/", json=payload)
    db.refresh(src)
    assert src.last_updated > before


def test_field_creation_updates_source_timestamp(client, db):
    src = create_dependencies(db)
    sensor_payload = {"mon_source_id": str(src.id), "sensor_name": "temp", "sensor_type": "analog"}
    sensor = client.post("/monitoring-sensors/", json=sensor_payload).json()
    db.refresh(src)
    before = src.last_updated
    field_payload = {"field_name": "val", "uom": "C"}
    client.post(f"/monitoring-sensors/{sensor['id']}/field", json=field_payload)
    db.refresh(src)
    assert src.last_updated > before
