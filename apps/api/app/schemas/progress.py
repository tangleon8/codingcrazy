from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ProgressBase(BaseModel):
    level_id: int


class ProgressCreate(ProgressBase):
    pass


class ProgressUpdate(BaseModel):
    attempts: int | None = None
    completed_at: datetime | None = None
    best_run_json: dict[str, Any] | None = None


class ProgressResponse(ProgressBase):
    id: int
    user_id: int
    attempts: int
    completed_at: datetime | None
    best_run_json: dict[str, Any] | None

    class Config:
        from_attributes = True


class SubmitCompletionRequest(BaseModel):
    level_id: int
    run_data: dict[str, Any]  # Contains action_count, time_taken, etc.


class SubmitCompletionResponse(BaseModel):
    success: bool
    message: str
    progress: ProgressResponse


class IncrementAttemptsRequest(BaseModel):
    level_id: int


class UserProgressSummary(BaseModel):
    """Summary of user's progress across all levels"""
    level_id: int
    level_slug: str
    level_title: str
    order_index: int
    attempts: int
    is_completed: bool
    is_unlocked: bool
