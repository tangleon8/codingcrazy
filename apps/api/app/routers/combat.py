import random
from fastapi import APIRouter, HTTPException
from app.core.deps import DbSession, CurrentUser
from app.models import EnemySpawn, Enemy, User, Item, PlayerInventory
from app.schemas.combat import (
    CombatStartRequest,
    CombatStartResponse,
    CombatActionRequest,
    CombatActionResponse,
    EnemyStats,
    DamageInfo,
)
from app.schemas.progression import calculate_xp_to_next_level


router = APIRouter(prefix="/combat", tags=["combat"])


def calculate_damage(attacker_attack: int, defender_defense: int, is_crit: bool = False) -> int:
    """Calculate damage dealt"""
    base_damage = max(1, attacker_attack - (defender_defense // 2))
    if is_crit:
        base_damage = int(base_damage * 1.5)
    return base_damage


def check_crit(crit_chance: float) -> bool:
    """Check if attack is critical"""
    return random.random() < crit_chance


def scale_enemy_stats(enemy: Enemy, level: int) -> dict:
    """Scale enemy stats based on level"""
    level_mult = 1 + (level - 1) * 0.15
    return {
        "hp": int(enemy.base_hp * level_mult),
        "attack": int(enemy.base_attack * level_mult),
        "defense": int(enemy.base_defense * level_mult),
        "xp_reward": int(enemy.xp_reward * level_mult),
        "coin_reward": int(enemy.coin_reward * level_mult),
    }


@router.post("/start", response_model=CombatStartResponse)
def start_combat(data: CombatStartRequest, db: DbSession, current_user: CurrentUser):
    """Initiate combat with an enemy"""
    spawn = db.query(EnemySpawn).filter(EnemySpawn.id == data.enemy_spawn_id).first()
    if not spawn:
        raise HTTPException(status_code=404, detail="Enemy not found")

    enemy = db.query(Enemy).filter(Enemy.id == spawn.enemy_id).first()
    if not enemy:
        raise HTTPException(status_code=404, detail="Enemy type not found")

    # Scale enemy stats
    enemy_level = random.randint(spawn.level_min, spawn.level_max)
    scaled = scale_enemy_stats(enemy, enemy_level)

    return CombatStartResponse(
        success=True,
        message=f"Combat started with {enemy.name}!",
        enemy=EnemyStats(
            id=str(spawn.id),
            name=enemy.name,
            enemy_type=enemy.enemy_type,
            hp=scaled["hp"],
            max_hp=scaled["hp"],
            attack=scaled["attack"],
            defense=scaled["defense"],
            level=enemy_level,
            xp_reward=scaled["xp_reward"],
            coin_reward=scaled["coin_reward"],
        ),
        player_hp=current_user.hp,
        player_max_hp=current_user.max_hp,
    )


@router.post("/action", response_model=CombatActionResponse)
def combat_action(data: CombatActionRequest, db: DbSession, current_user: CurrentUser):
    """Execute a combat action"""
    # This is a simplified combat system
    # In a full implementation, you'd track combat state in the database

    # For now, we'll handle basic attack/defend/flee
    player_action_result = ""
    enemy_action_result = ""
    player_damage = None
    enemy_damage = None
    combat_ended = False
    victory = False
    fled = False
    xp_gained = 0
    gold_gained = 0
    loot = []
    level_up = False
    new_level = None

    # Simulate enemy stats (in real implementation, track in session/db)
    enemy_hp = 50  # Would come from combat state
    enemy_attack = 10
    enemy_defense = 5

    if data.action == "attack":
        # Player attacks
        is_crit = check_crit(current_user.crit_chance)
        damage = calculate_damage(current_user.attack, enemy_defense, is_crit)
        enemy_hp -= damage

        player_damage = DamageInfo(
            amount=damage,
            is_critical=is_crit,
            was_blocked=False,
            blocked_amount=0,
        )
        player_action_result = f"You {'critically ' if is_crit else ''}hit for {damage} damage!"

        if enemy_hp <= 0:
            combat_ended = True
            victory = True
            xp_gained = 25  # Would come from enemy stats
            gold_gained = 10
            player_action_result += " Enemy defeated!"

            # Check for level up
            new_xp = current_user.current_xp + xp_gained
            xp_needed = calculate_xp_to_next_level(current_user.player_level)
            if new_xp >= xp_needed:
                level_up = True
                current_user.player_level += 1
                current_user.current_xp = new_xp - xp_needed
                current_user.max_hp += 10
                current_user.hp = current_user.max_hp
                current_user.attack += 2
                current_user.defense += 1
                new_level = current_user.player_level
            else:
                current_user.current_xp = new_xp

            current_user.coins += gold_gained
            db.commit()

    elif data.action == "defend":
        player_action_result = "You take a defensive stance."
        # Reduce damage taken this turn

    elif data.action == "flee":
        # 50% base flee chance, modified by speed difference
        flee_chance = 0.5
        if random.random() < flee_chance:
            fled = True
            combat_ended = True
            player_action_result = "You escaped successfully!"
        else:
            player_action_result = "Failed to escape!"

    elif data.action == "useItem":
        if not data.item_id:
            raise HTTPException(status_code=400, detail="Item ID required")

        # Find item in inventory
        inv_item = db.query(PlayerInventory).join(Item).filter(
            PlayerInventory.user_id == current_user.id,
            Item.item_id == data.item_id
        ).first()

        if not inv_item:
            raise HTTPException(status_code=404, detail="Item not found")

        item = inv_item.item
        if item.item_type != "consumable":
            raise HTTPException(status_code=400, detail="Item is not consumable")

        if item.effect_type == "heal":
            heal_amount = min(item.effect_value, current_user.max_hp - current_user.hp)
            current_user.hp += heal_amount
            player_action_result = f"Used {item.name}, restored {heal_amount} HP!"

        # Remove one item
        if inv_item.quantity <= 1:
            db.delete(inv_item)
        else:
            inv_item.quantity -= 1
        db.commit()

    # Enemy attacks (if combat didn't end)
    if not combat_ended:
        enemy_is_crit = check_crit(0.05)
        enemy_dmg = calculate_damage(enemy_attack, current_user.defense, enemy_is_crit)

        # Apply defend reduction
        if data.action == "defend":
            enemy_dmg = enemy_dmg // 2

        current_user.hp -= enemy_dmg

        enemy_damage = DamageInfo(
            amount=enemy_dmg,
            is_critical=enemy_is_crit,
            was_blocked=data.action == "defend",
            blocked_amount=enemy_dmg if data.action == "defend" else 0,
        )
        enemy_action_result = f"Enemy {'critically ' if enemy_is_crit else ''}attacks for {enemy_dmg} damage!"

        if current_user.hp <= 0:
            current_user.hp = 0
            combat_ended = True
            victory = False
            enemy_action_result += " You have been defeated!"

        db.commit()

    return CombatActionResponse(
        success=True,
        message="Action executed",
        player_action_result=player_action_result,
        enemy_action_result=enemy_action_result,
        player_damage=player_damage,
        enemy_damage=enemy_damage,
        player_hp=current_user.hp,
        enemy_hp=max(0, enemy_hp),
        combat_ended=combat_ended,
        victory=victory,
        fled=fled,
        xp_gained=xp_gained,
        gold_gained=gold_gained,
        loot=loot,
        level_up=level_up,
        new_level=new_level,
    )
