from pydantic import BaseModel


class CharacterBase(BaseModel):
    id: int
    name: str
    display_name: str
    description: str | None
    sprite_key: str
    level_required: int
    quests_required: list[int]
    coin_cost: int
    sort_order: int

    class Config:
        from_attributes = True


class CharacterWithStatus(CharacterBase):
    is_unlocked: bool
    is_selected: bool
    unlock_reason: str | None  # Why it's locked (level, quests, coins)


class SelectCharacterRequest(BaseModel):
    character_id: int


class PurchaseCharacterRequest(BaseModel):
    character_id: int
