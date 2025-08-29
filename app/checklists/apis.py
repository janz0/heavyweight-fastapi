# app/checklists/apis.py

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from . import services, schemas, models

router = APIRouter(prefix="/checklists", tags=["Checklists"])
# Templates
@router.get("/templates", response_model=List[schemas.ChecklistTemplateRead], summary="List all checklist templates")
def read_templates(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    return services.get_templates(db, skip=skip, limit=limit)

@router.post("/templates", response_model=schemas.ChecklistTemplateRead, summary="Create a new checklist template")
def create_template(
    tpl: schemas.ChecklistTemplateCreate,
    db: Session = Depends(get_db),
):
    return services.create_template(db, tpl)

# Categories
@router.get("/templates/{template_id}/categories", response_model=List[schemas.ChecklistTemplateCategoryRead], summary="Get categories for a template")
def read_categories_for_template(
    template_id: UUID,
    db: Session = Depends(get_db),
):
    return services.get_categories_for_template(db, template_id)

@router.post("/categories", response_model=schemas.ChecklistTemplateCategoryRead, summary="Create a new category")
def create_category(
    cat: schemas.ChecklistTemplateCategoryCreate,
    db: Session = Depends(get_db),
):
    return services.create_category(db, cat)

# Items
@router.get("/categories/{category_id}/items", response_model=List[schemas.ChecklistTemplateItemRead], summary="Get items for a category")
def read_items_for_category(
    category_id: UUID,
    db: Session = Depends(get_db),
):
    return services.get_items_for_category(db, category_id)

@router.post("/items", response_model=schemas.ChecklistTemplateItemRead, summary="Create a new item")
def create_item(
    item: schemas.ChecklistTemplateItemCreate,
    db: Session = Depends(get_db),
):
    return services.create_item(db, item)

@router.get("/{checklist_id}", response_model=schemas.ChecklistRead, summary="Fetch a single checklist by its ID")
def read_checklist(
    *,
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    cl = services.get_checklist(db, checklist_id)
    if not cl:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return cl


@router.post("/{checklist_id}/responses", response_model=List[schemas.ChecklistResponseRead])
def add_responses(
    *,
    checklist_id: UUID,
    reps: List[schemas.ChecklistResponseCreate],
    db: Session = Depends(get_db),
):
    return services.create_responses(db, checklist_id, reps)


@router.get("/{checklist_id}/responses", response_model=List[schemas.ChecklistResponseRead], summary="List all responses for a given checklist")
def read_responses(
    *,
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    return services.get_responses_for_checklist(db, checklist_id)

@router.get("/{checklist_id}/expanded",
            response_model=schemas.ChecklistExpandedRead,
            summary="Checklist with template categories/items + responses")
def read_checklist_expanded(
    *,
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    cl = services.get_checklist(db, checklist_id)
    if not cl:
        raise HTTPException(status_code=404, detail="Checklist not found")

    # template, categories, items
    tpl = db.query(models.ChecklistTemplate).filter(models.ChecklistTemplate.id == cl.template_id).first()
    cats = (
        db.query(models.ChecklistTemplateCategory)
          .filter(models.ChecklistTemplateCategory.template_id == cl.template_id)
          .order_by(models.ChecklistTemplateCategory.sort_order)
          .all()
    )

    # items per category
    cat_blocks = []
    item_ids = []
    for c in cats:
        items = (
            db.query(models.ChecklistTemplateItem)
              .filter(models.ChecklistTemplateItem.category_id == c.id)
              .order_by(models.ChecklistTemplateItem.sort_order)
              .all()
        )
        item_ids.extend([i.id for i in items])
        cat_blocks.append({
            "id": c.id,
            "title": c.title,
            "sort_order": c.sort_order,
            "items": [
                {
                    "id": i.id,
                    "prompt": i.prompt,
                    "response_type": i.response_type,
                    "sort_order": i.sort_order
                } for i in items
            ]
        })

    # responses for this checklist
    reps = (
        db.query(models.ChecklistResponse)
          .filter(models.ChecklistResponse.checklist_id == checklist_id)
          .all()
    )

    return {
        "id": cl.id,
        "template_id": cl.template_id,
        "template_name": tpl.name if tpl else "Checklist",
        "performed_at": cl.performed_at,
        "notes": cl.notes,
        "categories": cat_blocks,
        "responses": [
            {
                "id": r.id,
                "checklist_id": r.checklist_id,
                "template_item_id": r.template_item_id,
                "value": r.value,
                "comment": r.comment,
                "created_at": r.created_at
            } for r in reps
        ]
    }


@router.post("/", response_model=schemas.ChecklistRead)
def create_checklist(
    c: schemas.ChecklistCreate,
    db: Session = Depends(get_db),
):
    return services.create_checklist(db, c)

@router.get("/", response_model=List[schemas.ChecklistRead], summary="List checklists for a given location")
def read_checklists(
    *,
    location_id: UUID = Query(..., description="Filter by location ID"),
    db: Session = Depends(get_db),
):
    return services.get_checklists_for_location(db, location_id)