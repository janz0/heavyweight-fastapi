import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker

from app.config.database import DBBase
from app.monitoring_group.models import MonitoringGroup
from app.monitoring_sensor.models import MonitoringSensor
from app.monitoring_sensor_fields.models import MonitoringSensorField
from app.monitoring_sensor_data.models import MonitoringSensorData
from app.monitoring_source.models import Source
from app.location.models import Location
from app.project.models import Project
from app.monitoring_sensor_data import apis

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)


@event.listens_for(engine, "connect")
def _register_sqlite_uuid(dbapi_connection, _):
    dbapi_connection.create_function("gen_random_uuid", 0, lambda: str(uuid.uuid4()))


@compiles(PGUUID, "sqlite")
def _compile_pg_uuid(element, compiler, **kw):  # pragma: no cover
    return "TEXT"


@compiles(JSONB, "sqlite")
def _compile_pg_jsonb(element, compiler, **kw):  # pragma: no cover
    return "TEXT"


@pytest.fixture()
def db():
    tables = [
        Project.__table__,
        Location.__table__,
        Source.__table__,
        MonitoringGroup.__table__,
        MonitoringSensor.__table__,
        MonitoringSensorField.__table__,
        MonitoringSensorData.__table__,
    ]
    removed_defaults = []
    for table in tables:
        for column in table.columns:
            default = getattr(column, "server_default", None)
            if default is None:
                continue
            default_text = str(getattr(default, "arg", default))
            if "gen_random_uuid" in default_text:
                removed_defaults.append((column, default))
                column.server_default = None
    DBBase.metadata.create_all(bind=engine, tables=tables)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        DBBase.metadata.drop_all(bind=engine, tables=tables)
        for column, default in removed_defaults:
            column.server_default = default


def _create_sensor_with_data(db, *, source_name):
    project = Project(id=uuid.uuid4(), project_number="P1", project_name="Proj", start_date=datetime.utcnow().date(), status="active")
    location = Location(
        id=uuid.uuid4(),
        project_id=project.id,
        loc_number=f"L-{uuid.uuid4().hex[:4]}",
        loc_name="Loc",
        lat=0.0,
        lon=0.0,
        frequency="daily",
    )
    source = Source(
        id=uuid.uuid4(),
        mon_loc_id=location.id,
        folder_path="fp",
        file_keyword="kw",
        file_type="csv",
        source_name=source_name,
    )
    sensor = MonitoringSensor(
        id=uuid.uuid4(),
        mon_source_id=source.id,
        sensor_name=f"sensor-{source_name}",
        sensor_type="analog",
    )
    field = MonitoringSensorField(id=uuid.uuid4(), sensor_id=sensor.id, field_name="temp")
    data = MonitoringSensorData(
        mon_loc_id=location.id,
        sensor_id=sensor.id,
        sensor_field_id=field.id,
        timestamp=datetime.utcnow() + timedelta(seconds=len(source_name)),
        data=1.23,
    )
    db.add_all([project, location, source, sensor, field, data])
    db.commit()
    return source, sensor


def test_query_data_filters_by_source_ids(db):
    source_a, sensor_a = _create_sensor_with_data(db, source_name="Alpha")
    source_b, sensor_b = _create_sensor_with_data(db, source_name="Beta")

    results = apis._query_data(
        source_ids=f"{source_a.id}, {source_b.id}",
        include_field_name=True,
        db=db,
    )
    sensor_ids = {str(item["sensor_id"]) for item in results}
    assert sensor_ids == {str(sensor_a.id), str(sensor_b.id)}

    single = apis._query_data(
        source_ids=str(source_a.id),
        include_field_name=True,
        db=db,
    )
    assert {str(item["sensor_id"]) for item in single} == {str(sensor_a.id)}


def test_query_data_filters_by_source_names(db):
    _, sensor_alpha = _create_sensor_with_data(db, source_name="Alpha")
    _, sensor_beta = _create_sensor_with_data(db, source_name="Beta")

    results = apis._query_data(
        source_names="Alpha, Beta",
        include_field_name=True,
        db=db,
    )
    assert {str(item["sensor_id"]) for item in results} == {str(sensor_alpha.id), str(sensor_beta.id)}

    beta_only = apis._query_data(
        source_names="Beta",
        include_field_name=True,
        db=db,
    )
    assert {str(item["sensor_id"]) for item in beta_only} == {str(sensor_beta.id)}


def test_query_data_invalid_source_id_raises(db):
    with pytest.raises(apis.HTTPException):
        apis._query_data(source_ids="not-a-uuid", db=db)
