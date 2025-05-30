# app/checklists/apis.py

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from . import services, schemas, models

router = APIRouter(prefix="/checklists", tags=["Checklists"])


@router.post("/", response_model=schemas.ChecklistRead)
def create_checklist(
    c: schemas.ChecklistCreate,
    db: Session = Depends(get_db),
):
    return services.create_checklist(db, c)


@router.get(
    "/",
    response_model=List[schemas.ChecklistRead],
    summary="List checklists for a given location",
)
def read_checklists(
    *,
    location_id: UUID = Query(..., description="Filter by location ID"),
    db: Session = Depends(get_db),
):
    return services.get_checklists_for_location(db, location_id)


@router.get(
    "/{checklist_id}",
    response_model=schemas.ChecklistRead,
    summary="Fetch a single checklist by its ID",
)
def read_checklist(
    *,
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    cl = services.get_checklist(db, checklist_id)
    if not cl:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return cl


@router.post(
    "/{checklist_id}/responses",
    response_model=List[schemas.ChecklistResponseRead],
)
def add_responses(
    *,
    checklist_id: UUID,
    reps: List[schemas.ChecklistResponseCreate],
    db: Session = Depends(get_db),
):
    return services.create_responses(db, checklist_id, reps)


@router.get(
    "/{checklist_id}/responses",
    response_model=List[schemas.ChecklistResponseRead],
    summary="List all responses for a given checklist",
)
def read_responses(
    *,
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    return services.get_responses_for_checklist(db, checklist_id)
