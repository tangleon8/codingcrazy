from fastapi import APIRouter

from app.core.deps import DbSession, CurrentUser
from app.models.quest_progress import QuestProgress


router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/reset-progress")
def reset_user_progress(db: DbSession, current_user: CurrentUser):
    """Reset all progress for current user (dev only)"""
    # Reset quest progress
    db.query(QuestProgress).filter(QuestProgress.user_id == current_user.id).delete()

    # Reset player progression
    current_user.player_level = 1
    current_user.current_xp = 0
    current_user.coins = 0
    current_user.selected_character_id = None

    db.commit()

    return {"success": True, "message": "Progress reset"}
