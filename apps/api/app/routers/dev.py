from fastapi import APIRouter

from app.core.deps import DbSession, CurrentUser
from app.models.quest import Quest
from app.models.quest_progress import QuestProgress


router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/unlock-all-quests")
def unlock_all_quests(db: DbSession):
    """Unlock all quests by removing level requirements and prerequisites"""
    quests = db.query(Quest).all()
    for quest in quests:
        quest.level_requirement = 1
        quest.prerequisite_quests = []
    db.commit()
    return {"success": True, "message": f"Unlocked {len(quests)} quests"}


@router.post("/link-quests-to-levels")
def link_quests_to_levels(db: DbSession):
    """Link quests to their corresponding levels by matching names"""
    from app.models.level import Level

    # Map quest slugs to level slugs
    quest_level_map = {
        "quest-first-steps": "first-steps",
        "quest-turning-corners": "turning-corners",
        "quest-coin-hunter": "coin-collector",
        "quest-loop-master": "loop-the-loop",
        "quest-danger-zone": "danger-zone",
    }

    levels = {l.slug: l.id for l in db.query(Level).all()}
    linked = 0

    for quest_slug, level_slug in quest_level_map.items():
        quest = db.query(Quest).filter(Quest.slug == quest_slug).first()
        if quest and level_slug in levels:
            quest.level_id = levels[level_slug]
            linked += 1

    db.commit()
    return {"success": True, "message": f"Linked {linked} quests to levels"}


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
