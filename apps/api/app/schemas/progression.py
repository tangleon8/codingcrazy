from pydantic import BaseModel


def calculate_xp_to_next_level(level: int) -> int:
    """XP curve: base 100 then +25% each level"""
    base_xp = 100
    return int(base_xp * (1.25 ** (level - 1)))


class PlayerProgression(BaseModel):
    player_level: int
    current_xp: int
    xp_to_next_level: int
    coins: int
    selected_character_id: int | None

    class Config:
        from_attributes = True


class XPGainResponse(BaseModel):
    xp_gained: int
    coins_gained: int
    new_xp: int
    new_coins: int
    leveled_up: bool
    new_level: int | None
