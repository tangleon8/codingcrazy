from pydantic import BaseModel
from typing import Optional, Literal


class ItemInfo(BaseModel):
    id: str
    name: str
    description: Optional[str]
    item_type: str
    rarity: str
    quantity: int
    is_equipped: bool
    equip_slot: Optional[str]
    # Stats
    attack_bonus: int = 0
    defense_bonus: int = 0
    hp_bonus: int = 0
    # For consumables
    effect_type: Optional[str]
    effect_value: int = 0
    # Value
    buy_price: int
    sell_price: int
    sprite_key: str


class EquippedItems(BaseModel):
    weapon: Optional[ItemInfo]
    head: Optional[ItemInfo]
    chest: Optional[ItemInfo]
    legs: Optional[ItemInfo]
    feet: Optional[ItemInfo]
    accessory: Optional[ItemInfo]


class InventoryResponse(BaseModel):
    items: list[ItemInfo]
    equipped: EquippedItems
    gold: int
    max_slots: int
    used_slots: int


class UseItemRequest(BaseModel):
    item_id: str


class UseItemResponse(BaseModel):
    success: bool
    message: str
    hp_restored: int = 0
    mp_restored: int = 0
    effect_applied: Optional[str]
    item_consumed: bool
    remaining_quantity: int


class EquipItemRequest(BaseModel):
    item_id: str


class EquipItemResponse(BaseModel):
    success: bool
    message: str
    slot: str
    previous_item: Optional[ItemInfo]
    new_stats: dict


class UnequipRequest(BaseModel):
    slot: Literal["weapon", "head", "chest", "legs", "feet", "accessory"]


class UnequipResponse(BaseModel):
    success: bool
    message: str
    unequipped_item: Optional[ItemInfo]


class DropItemRequest(BaseModel):
    item_id: str
    quantity: int = 1


class DropItemResponse(BaseModel):
    success: bool
    message: str
    dropped_quantity: int
    remaining_quantity: int
