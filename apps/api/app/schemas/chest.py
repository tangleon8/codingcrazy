from pydantic import BaseModel
from typing import Optional


class ChestInfo(BaseModel):
    id: str
    chest_type: str
    position_x: int
    position_y: int
    is_locked: bool
    is_opened: bool
    required_key: Optional[str]


class LootItem(BaseModel):
    item_id: str
    name: str
    quantity: int
    rarity: str


class OpenChestRequest(BaseModel):
    chest_id: str


class OpenChestResponse(BaseModel):
    success: bool
    message: str
    gold_received: int
    items_received: list[LootItem]
    key_consumed: bool
    key_name: Optional[str]
