from fastapi import APIRouter, HTTPException, status

from app.core.deps import DbSession, CurrentUser
from app.models.character import Character
from app.schemas.character import (
    CharacterWithStatus,
    SelectCharacterRequest,
    PurchaseCharacterRequest,
)


router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("", response_model=list[CharacterWithStatus])
def list_characters(db: DbSession, current_user: CurrentUser):
    """Get all characters with unlock status"""
    characters = db.query(Character).order_by(Character.sort_order).all()

    result = []
    for char in characters:
        # Check unlock conditions (level-based only, quests removed)
        level_ok = current_user.player_level >= char.level_required

        # For coin-locked characters, they need to purchase
        is_unlocked = level_ok and char.coin_cost == 0

        # If character has a coin cost, check if player can afford it
        coins_ok = char.coin_cost == 0 or current_user.coins >= char.coin_cost

        unlock_reason = None
        if not level_ok:
            unlock_reason = f"Requires level {char.level_required}"
        elif char.coin_cost > 0 and not coins_ok:
            unlock_reason = f"Costs {char.coin_cost} coins"
        elif char.coin_cost > 0:
            unlock_reason = f"Purchase for {char.coin_cost} coins"

        result.append(CharacterWithStatus(
            id=char.id,
            name=char.name,
            display_name=char.display_name,
            description=char.description,
            sprite_key=char.sprite_key,
            level_required=char.level_required,
            quests_required=[],
            coin_cost=char.coin_cost,
            sort_order=char.sort_order,
            is_unlocked=is_unlocked or (coins_ok and level_ok),
            is_selected=current_user.selected_character_id == char.id,
            unlock_reason=unlock_reason if not (is_unlocked or (coins_ok and level_ok)) else None,
        ))

    return result


@router.post("/select")
def select_character(data: SelectCharacterRequest, db: DbSession, current_user: CurrentUser):
    """Select a character for the player"""
    char = db.query(Character).filter(Character.id == data.character_id).first()
    if not char:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    # Verify unlock status
    level_ok = current_user.player_level >= char.level_required

    if not level_ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Requires level {char.level_required}")
    if char.coin_cost > 0 and current_user.coins < char.coin_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough coins (need {char.coin_cost})")

    current_user.selected_character_id = char.id
    db.commit()

    return {"success": True, "selected_character_id": char.id}


@router.post("/purchase")
def purchase_character(data: PurchaseCharacterRequest, db: DbSession, current_user: CurrentUser):
    """Purchase a coin-locked character"""
    char = db.query(Character).filter(Character.id == data.character_id).first()
    if not char:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    if char.coin_cost == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Character is not purchasable")

    if current_user.coins < char.coin_cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough coins")

    # Deduct coins and select the character
    current_user.coins -= char.coin_cost
    current_user.selected_character_id = char.id
    db.commit()

    return {"success": True, "remaining_coins": current_user.coins}
