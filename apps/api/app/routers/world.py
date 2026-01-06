from fastapi import APIRouter, HTTPException, status
from app.core.deps import DbSession, CurrentUser
from app.models import WorldZone, User, EnemySpawn, NPC, WorldChest, Enemy
from app.schemas.world import (
    ZoneResponse,
    PlayerWorldState,
    UpdatePositionRequest,
    ZoneTransitionRequest,
    WorldStateResponse,
    NearbyEntity,
    Position,
)
from app.schemas.progression import calculate_xp_to_next_level


router = APIRouter(prefix="/world", tags=["world"])


def calculate_distance(x1: int, y1: int, x2: int, y2: int) -> int:
    """Calculate Manhattan distance between two points"""
    return abs(x1 - x2) + abs(y1 - y2)


@router.get("/state", response_model=WorldStateResponse)
def get_world_state(db: DbSession, current_user: CurrentUser):
    """Get the current world state for the player"""
    # Get or assign player's zone
    if current_user.current_zone_id is None:
        # Assign to starting zone
        starting_zone = db.query(WorldZone).filter(WorldZone.is_starting_zone == True).first()
        if not starting_zone:
            starting_zone = db.query(WorldZone).first()
        if not starting_zone:
            raise HTTPException(status_code=404, detail="No zones available")

        current_user.current_zone_id = starting_zone.id
        current_user.world_x = starting_zone.spawn_x
        current_user.world_y = starting_zone.spawn_y
        db.commit()

    zone = db.query(WorldZone).filter(WorldZone.id == current_user.current_zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Current zone not found")

    # Build player state
    player_state = PlayerWorldState(
        zone_id=zone.id,
        zone_slug=zone.slug,
        zone_name=zone.name,
        position=Position(x=current_user.world_x, y=current_user.world_y),
        hp=current_user.hp,
        max_hp=current_user.max_hp,
        mp=current_user.mp,
        max_mp=current_user.max_mp,
        level=current_user.player_level,
        xp=current_user.current_xp,
        xp_to_next=calculate_xp_to_next_level(current_user.player_level),
        gold=current_user.coins,
        attack=current_user.attack,
        defense=current_user.defense,
    )

    # Get nearby entities (within 10 tiles)
    nearby_range = 10
    px, py = current_user.world_x, current_user.world_y

    # Nearby enemies
    enemy_spawns = db.query(EnemySpawn).filter(EnemySpawn.zone_id == zone.id).all()
    nearby_enemies = []
    for spawn in enemy_spawns:
        dist = calculate_distance(px, py, spawn.spawn_x, spawn.spawn_y)
        if dist <= nearby_range:
            enemy = db.query(Enemy).filter(Enemy.id == spawn.enemy_id).first()
            if enemy:
                nearby_enemies.append(NearbyEntity(
                    id=str(spawn.id),
                    name=enemy.name,
                    entity_type="enemy",
                    position=Position(x=spawn.spawn_x, y=spawn.spawn_y),
                    distance=dist,
                ))

    # Nearby NPCs
    npcs = db.query(NPC).filter(NPC.zone_id == zone.id).all()
    nearby_npcs = []
    for npc in npcs:
        dist = calculate_distance(px, py, npc.position_x, npc.position_y)
        if dist <= nearby_range:
            nearby_npcs.append(NearbyEntity(
                id=npc.npc_id,
                name=npc.display_name,
                entity_type="npc",
                position=Position(x=npc.position_x, y=npc.position_y),
                distance=dist,
            ))

    # Nearby chests
    chests = db.query(WorldChest).filter(WorldChest.zone_id == zone.id).all()
    nearby_chests = []
    for chest in chests:
        dist = calculate_distance(px, py, chest.position_x, chest.position_y)
        if dist <= nearby_range:
            nearby_chests.append(NearbyEntity(
                id=chest.chest_id,
                name=f"{chest.chest_type.title()} Chest",
                entity_type="chest",
                position=Position(x=chest.position_x, y=chest.position_y),
                distance=dist,
            ))

    return WorldStateResponse(
        player=player_state,
        zone=ZoneResponse.model_validate(zone),
        nearby_enemies=nearby_enemies,
        nearby_npcs=nearby_npcs,
        nearby_chests=nearby_chests,
        nearby_items=[],  # TODO: Implement item drops
    )


@router.get("/zones/{zone_slug}", response_model=ZoneResponse)
def get_zone(zone_slug: str, db: DbSession, current_user: CurrentUser):
    """Get zone data by slug"""
    zone = db.query(WorldZone).filter(WorldZone.slug == zone_slug).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Check level requirement
    if current_user.player_level < zone.level_requirement:
        raise HTTPException(
            status_code=403,
            detail=f"Level {zone.level_requirement} required to access this zone"
        )

    return ZoneResponse.model_validate(zone)


@router.post("/move")
def update_position(data: UpdatePositionRequest, db: DbSession, current_user: CurrentUser):
    """Update player position after movement"""
    zone = db.query(WorldZone).filter(WorldZone.id == current_user.current_zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Current zone not found")

    # Validate position is within bounds
    if data.x < 0 or data.x >= zone.width or data.y < 0 or data.y >= zone.height:
        raise HTTPException(status_code=400, detail="Position out of bounds")

    current_user.world_x = data.x
    current_user.world_y = data.y
    db.commit()

    return {"success": True, "message": "Position updated", "x": data.x, "y": data.y}


@router.post("/transition")
def transition_zone(data: ZoneTransitionRequest, db: DbSession, current_user: CurrentUser):
    """Transition player to a different zone"""
    target_zone = db.query(WorldZone).filter(WorldZone.slug == data.target_zone_slug).first()
    if not target_zone:
        raise HTTPException(status_code=404, detail="Target zone not found")

    # Check level requirement
    if current_user.player_level < target_zone.level_requirement:
        raise HTTPException(
            status_code=403,
            detail=f"Level {target_zone.level_requirement} required"
        )

    # Update player's zone and position
    current_user.current_zone_id = target_zone.id
    current_user.world_x = target_zone.spawn_x
    current_user.world_y = target_zone.spawn_y
    db.commit()

    return {
        "success": True,
        "message": f"Traveled to {target_zone.name}",
        "zone_slug": target_zone.slug,
        "position": {"x": target_zone.spawn_x, "y": target_zone.spawn_y}
    }


@router.post("/respawn")
def respawn_player(db: DbSession, current_user: CurrentUser):
    """Respawn player at the zone's spawn point with full HP"""
    zone = db.query(WorldZone).filter(WorldZone.id == current_user.current_zone_id).first()
    if not zone:
        # Respawn at starting zone
        zone = db.query(WorldZone).filter(WorldZone.is_starting_zone == True).first()
        if not zone:
            zone = db.query(WorldZone).first()
        current_user.current_zone_id = zone.id

    # Restore HP and position
    current_user.hp = current_user.max_hp
    current_user.mp = current_user.max_mp
    current_user.world_x = zone.spawn_x
    current_user.world_y = zone.spawn_y

    # Lose some gold on death (10%)
    gold_lost = int(current_user.coins * 0.1)
    current_user.coins = max(0, current_user.coins - gold_lost)

    db.commit()

    return {
        "success": True,
        "message": f"Respawned at {zone.name}",
        "gold_lost": gold_lost,
        "position": {"x": zone.spawn_x, "y": zone.spawn_y}
    }
