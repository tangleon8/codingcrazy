from pydantic import BaseModel
from typing import Optional, Literal


class EnemyStats(BaseModel):
    id: str
    name: str
    enemy_type: str
    hp: int
    max_hp: int
    attack: int
    defense: int
    level: int
    xp_reward: int
    coin_reward: int


class CombatStartRequest(BaseModel):
    enemy_spawn_id: int


class CombatStartResponse(BaseModel):
    success: bool
    message: str
    enemy: Optional[EnemyStats]
    player_hp: int
    player_max_hp: int


class CombatActionRequest(BaseModel):
    action: Literal["attack", "defend", "flee", "useItem"]
    item_id: Optional[str] = None


class DamageInfo(BaseModel):
    amount: int
    is_critical: bool
    was_blocked: bool
    blocked_amount: int


class CombatActionResponse(BaseModel):
    success: bool
    message: str
    player_action_result: Optional[str]
    enemy_action_result: Optional[str]
    player_damage: Optional[DamageInfo]
    enemy_damage: Optional[DamageInfo]
    player_hp: int
    enemy_hp: int
    combat_ended: bool
    victory: bool
    fled: bool
    xp_gained: int
    gold_gained: int
    loot: list[dict]
    level_up: bool
    new_level: Optional[int]


class CombatEndRequest(BaseModel):
    enemy_spawn_id: int
    outcome: Literal["victory", "defeat", "fled"]
    damage_dealt: int
    damage_taken: int


class CombatEndResponse(BaseModel):
    success: bool
    xp_gained: int
    gold_gained: int
    items_received: list[dict]
    level_up: bool
    new_level: Optional[int]
