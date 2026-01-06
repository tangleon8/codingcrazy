from pydantic import BaseModel
from typing import Optional


class Position(BaseModel):
    x: int
    y: int


class ZoneConnection(BaseModel):
    target_zone_id: int
    target_zone_slug: str
    position: Position
    target_position: Position
    is_locked: bool = False


class ZoneResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str]
    width: int
    height: int
    terrain_data: dict
    spawn_x: int
    spawn_y: int
    connections: list[ZoneConnection]
    level_requirement: int
    enemy_level_min: int
    enemy_level_max: int

    class Config:
        from_attributes = True


class PlayerWorldState(BaseModel):
    """Current player state in the world"""
    zone_id: int
    zone_slug: str
    zone_name: str
    position: Position
    hp: int
    max_hp: int
    mp: int
    max_mp: int
    level: int
    xp: int
    xp_to_next: int
    gold: int
    attack: int
    defense: int


class UpdatePositionRequest(BaseModel):
    x: int
    y: int


class ZoneTransitionRequest(BaseModel):
    target_zone_slug: str
    spawn_point_id: Optional[str] = None


class NearbyEntity(BaseModel):
    id: str
    name: str
    entity_type: str
    position: Position
    distance: int


class WorldStateResponse(BaseModel):
    """Full world state for rendering"""
    player: PlayerWorldState
    zone: ZoneResponse
    nearby_enemies: list[NearbyEntity]
    nearby_npcs: list[NearbyEntity]
    nearby_chests: list[NearbyEntity]
    nearby_items: list[NearbyEntity]
