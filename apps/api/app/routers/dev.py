from fastapi import APIRouter

from app.core.deps import DbSession, CurrentUser
from app.models import Progress, ChestProgress, PlayerInventory


router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/reset-progress")
def reset_user_progress(db: DbSession, current_user: CurrentUser):
    """Reset all progress for current user (dev only)"""
    # Reset level progress
    db.query(Progress).filter(Progress.user_id == current_user.id).delete()

    # Reset chest progress
    db.query(ChestProgress).filter(ChestProgress.user_id == current_user.id).delete()

    # Reset inventory
    db.query(PlayerInventory).filter(PlayerInventory.user_id == current_user.id).delete()

    # Reset player stats to starting values
    current_user.player_level = 1
    current_user.current_xp = 0
    current_user.coins = 50  # Starting gold
    current_user.hp = 100
    current_user.max_hp = 100
    current_user.mp = 30
    current_user.max_mp = 30
    current_user.attack = 10
    current_user.defense = 5
    current_user.speed = 5
    current_user.crit_chance = 0.05
    current_user.world_x = 25
    current_user.world_y = 25
    current_user.current_zone_id = None
    current_user.equipped_weapon_id = None
    current_user.equipped_head_id = None
    current_user.equipped_chest_id = None
    current_user.equipped_legs_id = None
    current_user.equipped_feet_id = None
    current_user.equipped_accessory_id = None
    current_user.selected_character_id = None

    db.commit()

    return {"success": True, "message": "Progress reset"}


@router.post("/give-gold")
def give_gold(amount: int, db: DbSession, current_user: CurrentUser):
    """Give gold to current user (dev only)"""
    current_user.coins += amount
    db.commit()
    return {"success": True, "new_gold": current_user.coins}


@router.post("/set-level")
def set_level(level: int, db: DbSession, current_user: CurrentUser):
    """Set player level (dev only)"""
    current_user.player_level = max(1, level)
    current_user.current_xp = 0
    db.commit()
    return {"success": True, "new_level": current_user.player_level}


@router.post("/heal")
def heal_player(db: DbSession, current_user: CurrentUser):
    """Fully heal current user (dev only)"""
    current_user.hp = current_user.max_hp
    current_user.mp = current_user.max_mp
    db.commit()
    return {"success": True, "hp": current_user.hp, "mp": current_user.mp}
