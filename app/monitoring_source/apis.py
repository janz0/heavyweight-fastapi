from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from app.monitoring_source import schemas, selectors, services
from app.monitoring_sensor import schemas as sensor_schemas, services as sensor_services
from app.organizations.dependencies import get_current_org_id

router = APIRouter(prefix="/monitoring-sources", tags=["Monitoring Sources"])

@router.post("/", response_model=schemas.Source, status_code=status.HTTP_201_CREATED)
def create_source(payload: schemas.SourceCreate, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)):
    src = services.create_source(db, payload, org_id)
    return services.enrich_source(src, False, False)

@router.get("/", response_model=List[schemas.Source])
def list_sources(
    skip: int = 0,
    project_ids: Optional[List[UUID]] = Query(default=None),
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
):
    sources = selectors.get_sources_for_org(db, org_id=org_id, project_ids=project_ids, skip=skip)
    return [services.enrich_source(src, False, False) for src in sources]

@router.get("/last-updated", response_model=List[schemas.SourceLastUpdated])
def list_sources_last_updated(
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
):
    rows = selectors.get_source_updates(db, skip)
    return [schemas.SourceLastUpdated(id=row[0], last_updated=row[1]) for row in rows]


@router.get("/with-children", response_model=List[schemas.SourceWithSensors])
def list_sources_with_children(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    sources = selectors.get_sources(db, skip, limit)
    return [services.enrich_source(src, True, False) for src in sources]


@router.get(
    "/with-minimal-children",
    response_model=List[schemas.SourceWithSensorNames],
)
def list_sources_with_minimal_children(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    sources = selectors.get_sources(db, skip, limit)
    return [services.enrich_source(src, True, True) for src in sources]


@router.get("/{source_id}", response_model=schemas.Source)
def get_source(
    source_id: UUID,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id)
):
    src = selectors.get_source_for_org(db, source_id, org_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    return services.enrich_source(src, False, False)


@router.get("/{source_id}/with-children", response_model=schemas.SourceWithSensors)
def get_source_with_children(source_id: UUID, db: Session = Depends(get_db)):
    src = selectors.get_source(db, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    return services.enrich_source(src, True, False)


@router.get(
    "/{source_id}/with-minimal-children", response_model=schemas.SourceWithSensorNames
)
def get_source_with_minimal_children(source_id: UUID, db: Session = Depends(get_db)):
    src = selectors.get_source(db, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    return services.enrich_source(src, True, True)


@router.get("/name/{source_name}", response_model=schemas.Source)
def get_source_by_name(source_name: str, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)):
    src = selectors.get_source_by_name_for_org(db, source_name, org_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    return services.enrich_source(src)

@router.patch("/{source_id}", response_model=schemas.Source)
def update_source(
    source_id: UUID, payload: schemas.SourceUpdate, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)
):
    if not selectors.get_source_for_org(db, source_id, org_id):
        raise HTTPException(status_code=404, detail="Source not found")

    obj = services.update_source(db, source_id, payload, org_id)
    return services.enrich_source(obj, False, False)


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: UUID, db: Session = Depends(get_db), org_id: UUID = Depends(get_current_org_id)):
    if not selectors.get_source_for_org(db, source_id, org_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Source not found")
    services.delete_source(db, source_id, org_id)

@router.get(
    "/{source_id}/sensors",
    response_model=List[sensor_schemas.MonitoringSensor]
)
def list_source_sensors(
    source_id: UUID,
    skip: int = 0,
    db: Session = Depends(get_db),
    org_id: UUID = Depends(get_current_org_id),
):
    sensors = sensor_services.list_sensors_for_source(db, source_id, skip=skip, org_id=org_id)
    return [sensor_services.enrich_sensor(sen) for sen in sensors]