"""
Seed data for the open-world RPG system.
Creates starter zone, enemies, items, NPCs, and chests.
"""
from sqlalchemy.orm import Session
from app.models import WorldZone, Enemy, EnemySpawn, Item, NPC, WorldChest


def seed_world_data(db: Session):
    """Seed initial world data"""

    # Check if data already exists
    existing_zone = db.query(WorldZone).first()
    if existing_zone:
        print("World data already seeded, skipping...")
        return

    print("Seeding world data...")

    # ===== ITEMS =====
    items = [
        Item(
            item_id="wooden_sword",
            name="Wooden Sword",
            description="A basic training sword. Not very sharp.",
            item_type="weapon",
            rarity="common",
            equip_slot="weapon",
            attack_bonus=3,
            defense_bonus=0,
            hp_bonus=0,
            effect_type=None,
            effect_value=0,
            buy_price=25,
            sell_price=10,
            sprite_key="sword_wooden",
        ),
        Item(
            item_id="iron_sword",
            name="Iron Sword",
            description="A sturdy iron blade.",
            item_type="weapon",
            rarity="uncommon",
            equip_slot="weapon",
            attack_bonus=8,
            defense_bonus=0,
            hp_bonus=0,
            effect_type=None,
            effect_value=0,
            buy_price=100,
            sell_price=40,
            sprite_key="sword_iron",
        ),
        Item(
            item_id="leather_armor",
            name="Leather Armor",
            description="Basic protection made from tanned hides.",
            item_type="armor",
            rarity="common",
            equip_slot="chest",
            attack_bonus=0,
            defense_bonus=3,
            hp_bonus=5,
            effect_type=None,
            effect_value=0,
            buy_price=50,
            sell_price=20,
            sprite_key="armor_leather",
        ),
        Item(
            item_id="iron_armor",
            name="Iron Armor",
            description="Solid iron plating for reliable defense.",
            item_type="armor",
            rarity="uncommon",
            equip_slot="chest",
            attack_bonus=0,
            defense_bonus=8,
            hp_bonus=15,
            effect_type=None,
            effect_value=0,
            buy_price=200,
            sell_price=80,
            sprite_key="armor_iron",
        ),
        Item(
            item_id="health_potion",
            name="Health Potion",
            description="Restores 30 HP when consumed.",
            item_type="consumable",
            rarity="common",
            equip_slot=None,
            attack_bonus=0,
            defense_bonus=0,
            hp_bonus=0,
            effect_type="heal",
            effect_value=30,
            buy_price=25,
            sell_price=10,
            sprite_key="potion_red",
        ),
        Item(
            item_id="greater_health_potion",
            name="Greater Health Potion",
            description="Restores 75 HP when consumed.",
            item_type="consumable",
            rarity="uncommon",
            equip_slot=None,
            attack_bonus=0,
            defense_bonus=0,
            hp_bonus=0,
            effect_type="heal",
            effect_value=75,
            buy_price=75,
            sell_price=30,
            sprite_key="potion_red_large",
        ),
        Item(
            item_id="mana_potion",
            name="Mana Potion",
            description="Restores 20 MP when consumed.",
            item_type="consumable",
            rarity="common",
            equip_slot=None,
            attack_bonus=0,
            defense_bonus=0,
            hp_bonus=0,
            effect_type="mana",
            effect_value=20,
            buy_price=25,
            sell_price=10,
            sprite_key="potion_blue",
        ),
        Item(
            item_id="rusty_key",
            name="Rusty Key",
            description="An old key that might open something.",
            item_type="key",
            rarity="common",
            equip_slot=None,
            attack_bonus=0,
            defense_bonus=0,
            hp_bonus=0,
            effect_type=None,
            effect_value=0,
            buy_price=0,
            sell_price=5,
            sprite_key="key_rusty",
        ),
        Item(
            item_id="leather_helmet",
            name="Leather Cap",
            description="A simple leather cap.",
            item_type="armor",
            rarity="common",
            equip_slot="head",
            attack_bonus=0,
            defense_bonus=2,
            hp_bonus=0,
            effect_type=None,
            effect_value=0,
            buy_price=30,
            sell_price=12,
            sprite_key="helmet_leather",
        ),
        Item(
            item_id="leather_boots",
            name="Leather Boots",
            description="Comfortable footwear for adventuring.",
            item_type="armor",
            rarity="common",
            equip_slot="feet",
            attack_bonus=0,
            defense_bonus=1,
            hp_bonus=0,
            effect_type=None,
            effect_value=0,
            buy_price=20,
            sell_price=8,
            sprite_key="boots_leather",
        ),
    ]

    for item in items:
        db.add(item)
    db.flush()
    print(f"Created {len(items)} items")

    # ===== ENEMIES =====
    enemies = [
        Enemy(
            enemy_type="green_slime",
            name="Green Slime",
            description="A gelatinous creature that oozes around.",
            base_hp=25,
            base_attack=5,
            base_defense=2,
            base_speed=3,
            xp_reward=10,
            coin_reward=5,
            aggro_range=3,
            loot_table=[
                {"item_id": "health_potion", "chance": 0.2, "quantity": 1},
            ],
            sprite_key="slime_green",
        ),
        Enemy(
            enemy_type="angry_bee",
            name="Angry Bee",
            description="A buzzing menace with a painful sting.",
            base_hp=15,
            base_attack=8,
            base_defense=1,
            base_speed=6,
            xp_reward=8,
            coin_reward=3,
            aggro_range=5,
            loot_table=[],
            sprite_key="bee",
        ),
        Enemy(
            enemy_type="wild_boar",
            name="Wild Boar",
            description="A territorial beast with sharp tusks.",
            base_hp=40,
            base_attack=10,
            base_defense=5,
            base_speed=4,
            xp_reward=20,
            coin_reward=12,
            aggro_range=4,
            loot_table=[
                {"item_id": "health_potion", "chance": 0.3, "quantity": 1},
            ],
            sprite_key="boar",
        ),
        Enemy(
            enemy_type="forest_spider",
            name="Forest Spider",
            description="A large spider lurking in the shadows.",
            base_hp=30,
            base_attack=12,
            base_defense=3,
            base_speed=5,
            xp_reward=15,
            coin_reward=8,
            aggro_range=6,
            loot_table=[
                {"item_id": "mana_potion", "chance": 0.15, "quantity": 1},
            ],
            sprite_key="spider",
        ),
        Enemy(
            enemy_type="goblin_scout",
            name="Goblin Scout",
            description="A sneaky goblin looking for trouble.",
            base_hp=35,
            base_attack=9,
            base_defense=4,
            base_speed=5,
            xp_reward=18,
            coin_reward=15,
            aggro_range=7,
            loot_table=[
                {"item_id": "health_potion", "chance": 0.25, "quantity": 1},
                {"item_id": "rusty_key", "chance": 0.1, "quantity": 1},
            ],
            sprite_key="goblin",
        ),
    ]

    for enemy in enemies:
        db.add(enemy)
    db.flush()
    print(f"Created {len(enemies)} enemy types")

    # ===== STARTER ZONE =====
    starter_zone = WorldZone(
        slug="peaceful-meadow",
        name="Peaceful Meadow",
        description="A calm grassland where new adventurers begin their journey. Perfect for learning the basics of combat and exploration.",
        width=50,
        height=50,
        terrain_data={
            "type": "grass",
            "tiles": [],  # In a real implementation, this would contain tile data
        },
        spawn_x=25,
        spawn_y=25,
        is_starting_zone=True,
        level_requirement=1,
        connections=[
            {"target_slug": "dark-forest", "x": 49, "y": 25, "required_level": 3},
        ],
    )
    db.add(starter_zone)
    db.flush()
    print(f"Created zone: {starter_zone.name}")

    # ===== ENEMY SPAWNS =====
    slime = db.query(Enemy).filter(Enemy.enemy_type == "green_slime").first()
    bee = db.query(Enemy).filter(Enemy.enemy_type == "angry_bee").first()
    boar = db.query(Enemy).filter(Enemy.enemy_type == "wild_boar").first()

    spawns = [
        EnemySpawn(zone_id=starter_zone.id, enemy_id=slime.id, spawn_x=20, spawn_y=20, level_min=1, level_max=2, respawn_time=60),
        EnemySpawn(zone_id=starter_zone.id, enemy_id=slime.id, spawn_x=30, spawn_y=20, level_min=1, level_max=2, respawn_time=60),
        EnemySpawn(zone_id=starter_zone.id, enemy_id=slime.id, spawn_x=25, spawn_y=35, level_min=1, level_max=3, respawn_time=60),
        EnemySpawn(zone_id=starter_zone.id, enemy_id=bee.id, spawn_x=15, spawn_y=30, level_min=1, level_max=2, respawn_time=45),
        EnemySpawn(zone_id=starter_zone.id, enemy_id=bee.id, spawn_x=35, spawn_y=30, level_min=1, level_max=2, respawn_time=45),
        EnemySpawn(zone_id=starter_zone.id, enemy_id=boar.id, spawn_x=40, spawn_y=40, level_min=2, level_max=4, respawn_time=120),
    ]

    for spawn in spawns:
        db.add(spawn)
    db.flush()
    print(f"Created {len(spawns)} enemy spawns")

    # ===== NPCs =====
    npcs = [
        NPC(
            npc_id="village_elder",
            name="elder",
            display_name="Village Elder",
            npc_type="quest_giver",
            zone_id=starter_zone.id,
            position_x=25,
            position_y=22,
            is_shopkeeper=False,
            dialogue_tree={
                "start_node": "greeting",
                "nodes": {
                    "greeting": {
                        "text": "Welcome, young adventurer! I am the Village Elder. This meadow has been peaceful for generations, but lately creatures have been growing restless. Perhaps you could help thin their numbers?",
                        "options": [
                            {"text": "I'll help!", "next_node": "quest_accept"},
                            {"text": "Tell me more about this place.", "next_node": "lore"},
                            {"text": "Goodbye.", "next_node": None},
                        ],
                    },
                    "quest_accept": {
                        "text": "Wonderful! Start by defeating the slimes nearby. They're weak but good practice. The merchant in town can sell you supplies if you need them.",
                        "options": [
                            {"text": "I'll get started.", "next_node": None},
                            {"text": "Where can I find the merchant?", "next_node": "merchant_location"},
                        ],
                    },
                    "lore": {
                        "text": "This meadow has been the starting point for adventurers for centuries. Learn to code your actions wisely - loops and conditionals will serve you well in combat!",
                        "options": [
                            {"text": "Tell me about combat.", "next_node": "combat_tips"},
                            {"text": "Thank you for the advice.", "next_node": None},
                        ],
                    },
                    "merchant_location": {
                        "text": "Old Marcus runs the shop just to the east. He sells weapons, armor, and potions. You'll need gold though - defeat monsters to earn some!",
                        "options": [
                            {"text": "Thanks!", "next_node": None},
                        ],
                    },
                    "combat_tips": {
                        "text": "Use hero.attack() to strike enemies. If your HP is low, use hero.useItem('health_potion') to heal. A while loop can help you fight until victory!",
                        "options": [
                            {"text": "That's helpful, thanks!", "next_node": None},
                        ],
                    },
                },
            },
            shop_items=None,
            sprite_key="npc_elder",
        ),
        NPC(
            npc_id="merchant_marcus",
            name="marcus",
            display_name="Marcus the Merchant",
            npc_type="merchant",
            zone_id=starter_zone.id,
            position_x=30,
            position_y=22,
            is_shopkeeper=True,
            dialogue_tree={
                "start_node": "greeting",
                "nodes": {
                    "greeting": {
                        "text": "Welcome to Marcus's Goods! I've got everything an adventurer needs. What can I do for you?",
                        "options": [
                            {"text": "Show me what you have.", "next_node": None, "action_type": "open_shop"},
                            {"text": "Just looking around.", "next_node": None},
                        ],
                    },
                },
            },
            shop_items=[
                {"item_id": "health_potion", "price": 25, "stock": -1},
                {"item_id": "greater_health_potion", "price": 75, "stock": 5},
                {"item_id": "mana_potion", "price": 25, "stock": -1},
                {"item_id": "wooden_sword", "price": 25, "stock": 3},
                {"item_id": "iron_sword", "price": 100, "stock": 2},
                {"item_id": "leather_armor", "price": 50, "stock": 3},
                {"item_id": "leather_helmet", "price": 30, "stock": 3},
                {"item_id": "leather_boots", "price": 20, "stock": 3},
            ],
            sprite_key="npc_merchant",
        ),
        NPC(
            npc_id="wandering_knight",
            name="knight",
            display_name="Sir Cedric",
            npc_type="trainer",
            zone_id=starter_zone.id,
            position_x=20,
            position_y=28,
            is_shopkeeper=False,
            dialogue_tree={
                "start_node": "greeting",
                "nodes": {
                    "greeting": {
                        "text": "Hail, adventurer! I am Sir Cedric, a knight who trains new warriors. Would you like some combat advice?",
                        "options": [
                            {"text": "Yes, please teach me.", "next_node": "lesson1"},
                            {"text": "No thanks.", "next_node": None},
                        ],
                    },
                    "lesson1": {
                        "text": "In combat, timing is everything. Use hero.defend() when you're low on health - it reduces damage by half. Combine it with healing for survivability!",
                        "options": [
                            {"text": "What about offense?", "next_node": "lesson2"},
                            {"text": "Thanks for the tip!", "next_node": None},
                        ],
                    },
                    "lesson2": {
                        "text": "For attacking, write a loop! Something like: while(hero.isInCombat()) { hero.attack(); } This will keep attacking until the battle ends.",
                        "options": [
                            {"text": "That's clever!", "next_node": "lesson3"},
                        ],
                    },
                    "lesson3": {
                        "text": "But be smart - add conditions! Check your HP with hero.getHp() and heal when it gets low. A good fighter knows when to attack and when to defend.",
                        "options": [
                            {"text": "I'll practice that. Thanks!", "next_node": None},
                        ],
                    },
                },
            },
            shop_items=None,
            sprite_key="npc_knight",
        ),
    ]

    for npc in npcs:
        db.add(npc)
    db.flush()
    print(f"Created {len(npcs)} NPCs")

    # ===== CHESTS =====
    rusty_key_item = db.query(Item).filter(Item.item_id == "rusty_key").first()

    chests = [
        WorldChest(
            chest_id="starter_chest_1",
            chest_type="wooden",
            zone_id=starter_zone.id,
            position_x=22,
            position_y=28,
            is_locked=False,
            is_one_time=True,
            required_key_item_id=None,
            loot_table=[
                {"item_id": "health_potion", "chance": 1.0, "quantity": 2},
            ],
            coin_amount=15,
        ),
        WorldChest(
            chest_id="starter_chest_2",
            chest_type="wooden",
            zone_id=starter_zone.id,
            position_x=35,
            position_y=35,
            is_locked=False,
            is_one_time=True,
            required_key_item_id=None,
            loot_table=[
                {"item_id": "mana_potion", "chance": 1.0, "quantity": 1},
                {"item_id": "health_potion", "chance": 0.5, "quantity": 1},
            ],
            coin_amount=25,
        ),
        WorldChest(
            chest_id="locked_chest_1",
            chest_type="iron",
            zone_id=starter_zone.id,
            position_x=45,
            position_y=45,
            is_locked=True,
            is_one_time=True,
            required_key_item_id=rusty_key_item.item_id if rusty_key_item else None,
            loot_table=[
                {"item_id": "iron_sword", "chance": 0.5, "quantity": 1},
                {"item_id": "greater_health_potion", "chance": 1.0, "quantity": 2},
            ],
            coin_amount=75,
        ),
    ]

    for chest in chests:
        db.add(chest)
    db.flush()
    print(f"Created {len(chests)} chests")

    # ===== SECOND ZONE (for progression) =====
    dark_forest = WorldZone(
        slug="dark-forest",
        name="Dark Forest",
        description="A dense forest where stronger monsters lurk. Only experienced adventurers should venture here.",
        width=60,
        height=60,
        terrain_data={
            "type": "forest",
            "tiles": [],
        },
        spawn_x=5,
        spawn_y=30,
        is_starting_zone=False,
        level_requirement=3,
        connections=[
            {"target_slug": "peaceful-meadow", "x": 0, "y": 30, "required_level": 1},
        ],
    )
    db.add(dark_forest)
    db.flush()
    print(f"Created zone: {dark_forest.name}")

    # Add some spawns to dark forest
    spider = db.query(Enemy).filter(Enemy.enemy_type == "forest_spider").first()
    goblin = db.query(Enemy).filter(Enemy.enemy_type == "goblin_scout").first()

    forest_spawns = [
        EnemySpawn(zone_id=dark_forest.id, enemy_id=spider.id, spawn_x=15, spawn_y=25, level_min=3, level_max=5, respawn_time=90),
        EnemySpawn(zone_id=dark_forest.id, enemy_id=spider.id, spawn_x=25, spawn_y=35, level_min=3, level_max=5, respawn_time=90),
        EnemySpawn(zone_id=dark_forest.id, enemy_id=goblin.id, spawn_x=30, spawn_y=30, level_min=3, level_max=6, respawn_time=120),
        EnemySpawn(zone_id=dark_forest.id, enemy_id=goblin.id, spawn_x=40, spawn_y=40, level_min=4, level_max=6, respawn_time=120),
    ]

    for spawn in forest_spawns:
        db.add(spawn)
    db.flush()
    print(f"Created {len(forest_spawns)} enemy spawns in Dark Forest")

    db.commit()
    print("World data seeding complete!")


if __name__ == "__main__":
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        seed_world_data(db)
    finally:
        db.close()
