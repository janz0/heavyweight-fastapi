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


def setup_entities(db):
    project = Project(id=uuid.uuid4(), project_name="P1", start_date=date.today(), status="active")
    db.add(project)
    db.commit()
    db.refresh(project)
    location = Location(id=uuid.uuid4(), project_id=project.id, loc_name="L1", lat=0.0, lon=0.0, frequency="daily")
    db.add(location)
    db.commit()
    db.refresh(location)
    src1 = Source(id=uuid.uuid4(), mon_loc_id=location.id, source_name="B", folder_path="fp", file_keyword="kw", file_type="csv")
    src2 = Source(id=uuid.uuid4(), mon_loc_id=location.id, source_name="A", folder_path="fp2", file_keyword="kw", file_type="csv")
    db.add_all([src1, src2])
    db.commit()
    db.refresh(src1)
    db.refresh(src2)
    return src1, src2


def test_source_sensor_field_ordering(client, db):
    src1, src2 = setup_entities(db)
    sensor_b = client.post("/monitoring-sensors/", json={"mon_source_id": str(src1.id), "sensor_name": "b", "sensor_type": "analog"}).json()
    client.post("/monitoring-sensors/", json={"mon_source_id": str(src1.id), "sensor_name": "a", "sensor_type": "analog"})

    client.post(f"/monitoring-sensors/{sensor_b['id']}/field", json={"field_name": "y", "uom": "C"})
    client.post(f"/monitoring-sensors/{sensor_b['id']}/field", json={"field_name": "x", "uom": "C"})

    sources = client.get("/monitoring-sources/").json()
    assert [s["source_name"] for s in sources] == sorted([s["source_name"] for s in sources])

    sensors = client.get("/monitoring-sensors/").json()
    assert [s["sensor_name"] for s in sensors] == sorted([s["sensor_name"] for s in sensors])

    fields = client.get(f"/monitoring-sensors/{sensor_b['id']}/fields").json()
    assert [f["field_name"] for f in fields] == sorted([f["field_name"] for f in fields])
