from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from app.monitoring_source import schemas, selectors, services

router = APIRouter(prefix="/monitoring-sources", tags=["Monitoring Sources"])


@router.post("/", response_model=schemas.Source, status_code=status.HTTP_201_CREATED)
def create_source(payload: schemas.SourceCreate, db: Session = Depends(get_db)):
    return services.create_source(db, payload)


@router.get("/", response_model=List[schemas.Source])
def list_sources(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    sources = selectors.get_sources(db, skip, limit)
    return [services.enrich_source(src, False, False) for src in sources]


@router.get("/last-updated", response_model=List[schemas.SourceLastUpdated])
def list_sources_last_updated(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    rows = selectors.get_source_updates(db, skip, limit)
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
):
    src = selectors.get_source(db, source_id)
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


@router.patch("/{source_id}", response_model=schemas.Source)
def update_source(
    source_id: UUID, payload: schemas.SourceUpdate, db: Session = Depends(get_db)
):
    obj = services.update_source(db, source_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Source not found")
    return obj


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_source(db, source_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Source not found")
    services.delete_source(db, source_id)
