from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.schemas.progression import PlayerProgression, calculate_xp_to_next_level


router = APIRouter(prefix="/progression", tags=["progression"])


@router.get("/me", response_model=PlayerProgression)
def get_my_progression(current_user: CurrentUser):
    """Get current user's progression stats"""
    return PlayerProgression(
        player_level=current_user.player_level,
        current_xp=current_user.current_xp,
        xp_to_next_level=calculate_xp_to_next_level(current_user.player_level),
        coins=current_user.coins,
        selected_character_id=current_user.selected_character_id,
    )
