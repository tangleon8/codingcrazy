from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import asc

from app.core.deps import DbSession, CurrentUser
from app.models.level import Level
from app.models.progress import Progress
from app.schemas.progress import (
    ProgressResponse,
    SubmitCompletionRequest,
    SubmitCompletionResponse,
    IncrementAttemptsRequest,
    UserProgressSummary,
)


router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("", response_model=list[UserProgressSummary])
def get_user_progress(db: DbSession, current_user: CurrentUser):
    """Get progress summary for all levels for the current user"""
    # Get all levels
    levels = db.query(Level).order_by(asc(Level.order_index)).all()

    # Get all progress for this user
    progress_records = db.query(Progress).filter(Progress.user_id == current_user.id).all()
    progress_map = {p.level_id: p for p in progress_records}

    # Determine which levels are unlocked
    # First level is always unlocked, subsequent levels unlock when previous is completed
    result = []
    previous_completed = True  # First level is always unlocked

    for level in levels:
        progress = progress_map.get(level.id)
        is_completed = progress is not None and progress.completed_at is not None

        result.append(UserProgressSummary(
            level_id=level.id,
            level_slug=level.slug,
            level_title=level.title,
            order_index=level.order_index,
            attempts=progress.attempts if progress else 0,
            is_completed=is_completed,
            is_unlocked=previous_completed,
        ))

        # For next iteration
        previous_completed = is_completed

    return result


@router.get("/{level_id}", response_model=ProgressResponse | None)
def get_level_progress(level_id: int, db: DbSession, current_user: CurrentUser):
    """Get progress for a specific level"""
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.level_id == level_id
    ).first()

    if not progress:
        return None

    return ProgressResponse.model_validate(progress)


@router.post("/attempt", response_model=ProgressResponse)
def increment_attempts(data: IncrementAttemptsRequest, db: DbSession, current_user: CurrentUser):
    """Increment attempt count for a level"""
    # Verify level exists
    level = db.query(Level).filter(Level.id == data.level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )

    # Get or create progress record
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.level_id == data.level_id
    ).first()

    if not progress:
        progress = Progress(
            user_id=current_user.id,
            level_id=data.level_id,
            attempts=1,
        )
        db.add(progress)
    else:
        progress.attempts += 1

    db.commit()
    db.refresh(progress)

    return ProgressResponse.model_validate(progress)


@router.post("/complete", response_model=SubmitCompletionResponse)
def submit_completion(data: SubmitCompletionRequest, db: DbSession, current_user: CurrentUser):
    """Submit a level completion"""
    # Verify level exists
    level = db.query(Level).filter(Level.id == data.level_id).first()
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )

    # Get or create progress record
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.level_id == data.level_id
    ).first()

    if not progress:
        progress = Progress(
            user_id=current_user.id,
            level_id=data.level_id,
            attempts=1,
            completed_at=datetime.utcnow(),
            best_run_json=data.run_data,
        )
        db.add(progress)
    else:
        # Only update if not already completed or if this run is better
        if progress.completed_at is None:
            progress.completed_at = datetime.utcnow()
            progress.best_run_json = data.run_data
        elif data.run_data.get("action_count", float("inf")) < (progress.best_run_json or {}).get("action_count", float("inf")):
            progress.best_run_json = data.run_data

    db.commit()
    db.refresh(progress)

    return SubmitCompletionResponse(
        success=True,
        message="Level completed!",
        progress=ProgressResponse.model_validate(progress)
    )
