from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.common.dependencies import get_db
from app.monitoring_source import schemas, services, selectors

router = APIRouter(prefix="/monitoring-sources", tags=["Monitoring Sources"])

@router.post("/", response_model=schemas.Source, status_code=status.HTTP_201_CREATED)
def create_source(payload: schemas.SourceCreate, db: Session = Depends(get_db)):
    return services.create_source(db, payload)

@router.get(
    "/",
    response_model=List[
        schemas.Source
        | schemas.SourceWithSensors
        | schemas.SourceWithSensorNames
    ],
)
def list_sources(
    skip: int = 0,
    limit: int = 100,
    children: bool = False,
    minimal: bool = False,
    db: Session = Depends(get_db),
):
    sources = selectors.get_sources(db, skip, limit)
    return [services.enrich_source(src, children, minimal) for src in sources]

@router.get(
    "/{source_id}",
    response_model=
        schemas.Source | schemas.SourceWithSensors | schemas.SourceWithSensorNames,
)
def get_source(
    source_id: UUID,
    children: bool = False,
    minimal: bool = False,
    db: Session = Depends(get_db),
):
    src = selectors.get_source(db, source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    return services.enrich_source(src, children, minimal)

@router.patch("/{source_id}", response_model=schemas.Source)
def update_source(source_id: UUID, payload: schemas.SourceUpdate, db: Session = Depends(get_db)):
    obj = services.update_source(db, source_id, payload)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Source not found")
    return obj

@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: UUID, db: Session = Depends(get_db)):
    if not selectors.get_source(db, source_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Source not found")
    services.delete_source(db, source_id)
