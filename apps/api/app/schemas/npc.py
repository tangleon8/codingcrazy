from pydantic import BaseModel
from typing import Optional


class DialogueOption(BaseModel):
    text: str
    next_node: Optional[str]
    action_type: Optional[str]  # "open_shop", "give_item", "heal", etc.


class DialogueNode(BaseModel):
    text: str
    options: list[DialogueOption]


class NPCInfo(BaseModel):
    id: str
    name: str
    display_name: str
    npc_type: str
    position_x: int
    position_y: int
    is_shopkeeper: bool
    sprite_key: str


class NPCDialogueResponse(BaseModel):
    npc: NPCInfo
    current_node: DialogueNode
    dialogue_history: list[str]


class DialogueSelectRequest(BaseModel):
    option_index: int


class DialogueSelectResponse(BaseModel):
    success: bool
    message: str
    next_node: Optional[DialogueNode]
    conversation_ended: bool
    action_triggered: Optional[str]
    shop_opened: bool


class ShopItem(BaseModel):
    item_id: str
    name: str
    description: Optional[str]
    item_type: str
    rarity: str
    price: int
    stock: int  # -1 for unlimited
    attack_bonus: int = 0
    defense_bonus: int = 0
    effect_type: Optional[str]
    effect_value: int = 0
    sprite_key: str


class ShopInventoryResponse(BaseModel):
    npc_id: str
    npc_name: str
    items: list[ShopItem]
    player_gold: int


class BuyItemRequest(BaseModel):
    item_id: str
    quantity: int = 1


class BuyItemResponse(BaseModel):
    success: bool
    message: str
    total_cost: int
    remaining_gold: int
    item_name: str
    quantity_purchased: int


class SellItemRequest(BaseModel):
    item_id: str
    quantity: int = 1


class SellItemResponse(BaseModel):
    success: bool
    message: str
    total_earned: int
    new_gold: int
    item_name: str
    quantity_sold: int
