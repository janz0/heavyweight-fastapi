# app/checklists/crud.py
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from . import models, schemas

#
# ─── TEMPLATES ───────────────────────────────────────────────────────────────
#
def get_templates(db: Session, skip: int = 0, limit: int = 100) -> List[models.ChecklistTemplate]:
    return db.query(models.ChecklistTemplate).offset(skip).limit(limit).all()

def create_template(db: Session, tpl_in: schemas.ChecklistTemplateCreate) -> models.ChecklistTemplate:
    tpl = models.ChecklistTemplate(**tpl_in.dict())
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl

#
# ─── CATEGORIES ──────────────────────────────────────────────────────────────
#
def get_categories_for_template(db: Session, template_id: UUID) -> List[models.ChecklistTemplateCategory]:
    return (
        db.query(models.ChecklistTemplateCategory)
          .filter(models.ChecklistTemplateCategory.template_id == template_id)
          .order_by(models.ChecklistTemplateCategory.sort_order)
          .all()
    )

def create_category(db: Session, cat_in: schemas.ChecklistTemplateCategoryCreate) -> models.ChecklistTemplateCategory:
    cat = models.ChecklistTemplateCategory(**cat_in.dict())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

#
# ─── ITEMS ───────────────────────────────────────────────────────────────────
#
def get_items_for_category(db: Session, category_id: UUID) -> List[models.ChecklistTemplateItem]:
    return (
        db.query(models.ChecklistTemplateItem)
          .filter(models.ChecklistTemplateItem.category_id == category_id)
          .order_by(models.ChecklistTemplateItem.sort_order)
          .all()
    )

def create_item(db: Session, item_in: schemas.ChecklistTemplateItemCreate) -> models.ChecklistTemplateItem:
    item = models.ChecklistTemplateItem(**item_in.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

#
# ─── CHECKLIST INSTANCES ────────────────────────────────────────────────────
#
def get_checklists_for_location(db: Session, location_id: UUID) -> List[models.Checklist]:
    return (
        db.query(models.Checklist)
          .filter(models.Checklist.location_id == location_id)
          .order_by(models.Checklist.performed_at.desc())
          .all()
    )

def create_checklist(db: Session, cl_in: schemas.ChecklistCreate) -> models.Checklist:
    cl = models.Checklist(**cl_in.dict())
    db.add(cl)
    db.commit()
    db.refresh(cl)
    return cl

#
# ─── RESPONSES ───────────────────────────────────────────────────────────────
#
def get_responses_for_checklist(db: Session, checklist_id: UUID) -> List[models.ChecklistResponse]:
    return (
        db.query(models.ChecklistResponse)
          .filter(models.ChecklistResponse.checklist_id == checklist_id)
          .all()
    )

def get_checklist(db: Session, checklist_id: UUID) -> models.Checklist | None:
    return (
        db.query(models.Checklist)
          .filter(models.Checklist.id == checklist_id)
          .first()
    )

def create_responses(db: Session,
                     checklist_id: UUID,
                     reps_in: List[schemas.ChecklistResponseCreate]
                    ) -> List[models.ChecklistResponse]:
    created = []
    for rep in reps_in:
        # ensure the payload has the checklist_id
        rep_data = rep.dict()
        rep_data["checklist_id"] = checklist_id
        db_obj = models.ChecklistResponse(**rep_data)
        db.add(db_obj)
        created.append(db_obj)
    db.commit()
    for obj in created:
        db.refresh(obj)
    return created