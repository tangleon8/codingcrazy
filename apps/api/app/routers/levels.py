from fastapi import APIRouter, HTTPException, status
from sqlalchemy import asc

from app.core.deps import DbSession, AdminUser, OptionalUser
from app.models.level import Level
from app.schemas.level import LevelResponse, LevelListItem, LevelCreate, LevelUpdate


router = APIRouter(prefix="/levels", tags=["levels"])


@router.get("", response_model=list[LevelListItem])
def list_levels(db: DbSession):
    """Get all levels (without full JSON data)"""
    levels = db.query(Level).order_by(asc(Level.order_index)).all()
    return [LevelListItem.model_validate(level) for level in levels]


@router.get("/{slug}", response_model=LevelResponse)
def get_level(slug: str, db: DbSession):
    """Get a level by slug (includes full JSON data)"""
    level = db.query(Level).filter(Level.slug == slug).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )
    return LevelResponse.model_validate(level)


@router.get("/by-id/{level_id}", response_model=LevelResponse)
def get_level_by_id(level_id: int, db: DbSession):
    """Get a level by ID (includes full JSON data)"""
    level = db.query(Level).filter(Level.id == level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )
    return LevelResponse.model_validate(level)


# Admin endpoints

@router.post("", response_model=LevelResponse, status_code=status.HTTP_201_CREATED)
def create_level(level_data: LevelCreate, db: DbSession, admin: AdminUser):
    """Create a new level (admin only)"""
    # Check for duplicate slug
    existing = db.query(Level).filter(Level.slug == level_data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Level with this slug already exists"
        )

    level = Level(
        slug=level_data.slug,
        title=level_data.title,
        description=level_data.description,
        order_index=level_data.order_index,
        json_data=level_data.json_data,
    )

    db.add(level)
    db.commit()
    db.refresh(level)

    return LevelResponse.model_validate(level)


@router.put("/{slug}", response_model=LevelResponse)
def update_level(slug: str, level_data: LevelUpdate, db: DbSession, admin: AdminUser):
    """Update a level (admin only)"""
    level = db.query(Level).filter(Level.slug == slug).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )

    if level_data.title is not None:
        level.title = level_data.title
    if level_data.description is not None:
        level.description = level_data.description
    if level_data.order_index is not None:
        level.order_index = level_data.order_index
    if level_data.json_data is not None:
        level.json_data = level_data.json_data

    db.commit()
    db.refresh(level)

    return LevelResponse.model_validate(level)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_level(slug: str, db: DbSession, admin: AdminUser):
    """Delete a level (admin only)"""
    level = db.query(Level).filter(Level.slug == slug).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )

    db.delete(level)
    db.commit()
