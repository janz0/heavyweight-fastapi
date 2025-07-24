import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects import postgresql

from app.monitoring_sensor_data.selectors import query_monitoring_sensor_data


def test_query_uses_subquery_for_percentiles():
    engine = create_engine("postgresql://", strategy="mock", executor=lambda *a, **k: None)
    Session = sessionmaker(bind=engine)
    session = Session()

    q = query_monitoring_sensor_data(
        session,
        sensor_id=uuid.uuid4(),
        aggregate_period="day",
        trim_low=10,
        trim_high=10,
    )

    sql = str(q.statement.compile(dialect=postgresql.dialect()))
    assert "OVER" not in sql.upper()
