"""Seed script for quests and characters"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.quest import Quest
from app.models.character import Character
from app.models.level import Level


# 15 quests with branching paths on a visual map
# Map uses 0-1000 coordinate system, y=0 is top, y=1000 is bottom
SEED_QUESTS = [
    # Starting area (bottom of map)
    {
        "slug": "quest-first-steps",
        "title": "First Steps",
        "description": "Learn the basics of moving your hero across the grid.",
        "difficulty": "easy",
        "xp_reward": 50,
        "coin_reward": 10,
        "node_x": 500,
        "node_y": 900,
        "level_requirement": 1,
        "prerequisite_quests": [],
        "star_thresholds": {"1": 999, "2": 6, "3": 4},
    },
    # Branch point 1
    {
        "slug": "quest-turning-corners",
        "title": "Turning Corners",
        "description": "Navigate around obstacles and walls.",
        "difficulty": "easy",
        "xp_reward": 75,
        "coin_reward": 15,
        "node_x": 500,
        "node_y": 750,
        "level_requirement": 1,
        "prerequisite_quests": [1],  # Requires First Steps
        "star_thresholds": {"1": 999, "2": 12, "3": 8},
    },
    # Left branch
    {
        "slug": "quest-coin-hunter",
        "title": "Coin Hunter",
        "description": "Collect all the shiny coins scattered around!",
        "difficulty": "medium",
        "xp_reward": 100,
        "coin_reward": 25,
        "node_x": 300,
        "node_y": 600,
        "level_requirement": 2,
        "prerequisite_quests": [2],
        "star_thresholds": {"1": 999, "2": 15, "3": 10},
    },
    # Right branch
    {
        "slug": "quest-loop-master",
        "title": "Loop Master",
        "description": "Use for loops to repeat actions efficiently.",
        "difficulty": "medium",
        "xp_reward": 100,
        "coin_reward": 25,
        "node_x": 700,
        "node_y": 600,
        "level_requirement": 2,
        "prerequisite_quests": [2],
        "star_thresholds": {"1": 999, "2": 12, "3": 8},
    },
    # Left sub-branch
    {
        "slug": "quest-maze-runner",
        "title": "Maze Runner",
        "description": "Navigate through a complex maze to reach the goal.",
        "difficulty": "medium",
        "xp_reward": 125,
        "coin_reward": 30,
        "node_x": 200,
        "node_y": 450,
        "level_requirement": 3,
        "prerequisite_quests": [3],
        "star_thresholds": {"1": 999, "2": 20, "3": 14},
    },
    # Right sub-branch
    {
        "slug": "quest-timing-test",
        "title": "Timing Test",
        "description": "Wait for the right moment to avoid hazards!",
        "difficulty": "medium",
        "xp_reward": 125,
        "coin_reward": 30,
        "node_x": 800,
        "node_y": 450,
        "level_requirement": 3,
        "prerequisite_quests": [4],
        "star_thresholds": {"1": 999, "2": 18, "3": 12},
    },
    # Merge point (requires both branches)
    {
        "slug": "quest-danger-zone",
        "title": "Danger Zone",
        "description": "Avoid hazards and collect coins in this challenging level.",
        "difficulty": "hard",
        "xp_reward": 150,
        "coin_reward": 40,
        "node_x": 500,
        "node_y": 350,
        "level_requirement": 4,
        "prerequisite_quests": [5, 6],  # Requires both branches
        "star_thresholds": {"1": 999, "2": 25, "3": 18},
    },
    # Continue main path
    {
        "slug": "quest-variable-voyage",
        "title": "Variable Voyage",
        "description": "Use variables to solve complex puzzles.",
        "difficulty": "hard",
        "xp_reward": 175,
        "coin_reward": 45,
        "node_x": 500,
        "node_y": 250,
        "level_requirement": 5,
        "prerequisite_quests": [7],
        "star_thresholds": {"1": 999, "2": 20, "3": 15},
    },
    # Second branch point
    {
        "slug": "quest-conditional-chaos",
        "title": "Conditional Chaos",
        "description": "Master if/else statements to handle different scenarios.",
        "difficulty": "hard",
        "xp_reward": 200,
        "coin_reward": 50,
        "node_x": 350,
        "node_y": 150,
        "level_requirement": 6,
        "prerequisite_quests": [8],
        "star_thresholds": {"1": 999, "2": 22, "3": 16},
    },
    {
        "slug": "quest-function-frenzy",
        "title": "Function Frenzy",
        "description": "Create reusable functions to solve repetitive tasks.",
        "difficulty": "hard",
        "xp_reward": 200,
        "coin_reward": 50,
        "node_x": 650,
        "node_y": 150,
        "level_requirement": 6,
        "prerequisite_quests": [8],
        "star_thresholds": {"1": 999, "2": 22, "3": 16},
    },
    # Expert quest (requires both branches)
    {
        "slug": "quest-algorithm-arena",
        "title": "Algorithm Arena",
        "description": "Combine all your skills in this ultimate challenge.",
        "difficulty": "expert",
        "xp_reward": 250,
        "coin_reward": 75,
        "node_x": 500,
        "node_y": 50,
        "level_requirement": 7,
        "prerequisite_quests": [9, 10],
        "star_thresholds": {"1": 999, "2": 30, "3": 20},
    },
    # Bonus side quest (left side)
    {
        "slug": "quest-treasure-hunt",
        "title": "Treasure Hunt",
        "description": "Find the hidden treasure chest! Bonus coins await.",
        "difficulty": "medium",
        "xp_reward": 100,
        "coin_reward": 100,  # Bonus coins!
        "node_x": 100,
        "node_y": 350,
        "level_requirement": 3,
        "prerequisite_quests": [5],
        "star_thresholds": {"1": 999, "2": 25, "3": 18},
    },
    # Bonus side quest (right side)
    {
        "slug": "quest-speed-run",
        "title": "Speed Run",
        "description": "Complete as fast as possible with minimal moves!",
        "difficulty": "hard",
        "xp_reward": 150,
        "coin_reward": 35,
        "node_x": 900,
        "node_y": 350,
        "level_requirement": 4,
        "prerequisite_quests": [6],
        "star_thresholds": {"1": 999, "2": 15, "3": 10},
    },
    # Expert side quest
    {
        "slug": "quest-perfectionist",
        "title": "Perfectionist",
        "description": "Achieve perfection with optimal solutions.",
        "difficulty": "expert",
        "xp_reward": 300,
        "coin_reward": 100,
        "node_x": 150,
        "node_y": 100,
        "level_requirement": 8,
        "prerequisite_quests": [11],
        "star_thresholds": {"1": 999, "2": 25, "3": 18},
    },
    # Grand finale
    {
        "slug": "quest-grand-finale",
        "title": "Grand Finale",
        "description": "The ultimate challenge awaits! Only the best coders prevail.",
        "difficulty": "expert",
        "xp_reward": 500,
        "coin_reward": 200,
        "node_x": 850,
        "node_y": 100,
        "level_requirement": 10,
        "prerequisite_quests": [11, 13, 14],
        "star_thresholds": {"1": 999, "2": 40, "3": 28},
    },
]


# 8 characters with varied unlock conditions
SEED_CHARACTERS = [
    {
        "name": "knight",
        "display_name": "Sir Codealot",
        "description": "A brave knight learning the ways of code.",
        "sprite_key": "knight",
        "level_required": 1,
        "quests_required": [],
        "coin_cost": 0,
        "sort_order": 1,
    },
    {
        "name": "wizard",
        "display_name": "Merlin the Coder",
        "description": "A wise wizard who writes elegant and magical code.",
        "sprite_key": "wizard",
        "level_required": 3,
        "quests_required": [],
        "coin_cost": 0,
        "sort_order": 2,
    },
    {
        "name": "ninja",
        "display_name": "Code Ninja",
        "description": "Silent but deadly efficient code. Strikes with precision.",
        "sprite_key": "ninja",
        "level_required": 5,
        "quests_required": [],
        "coin_cost": 0,
        "sort_order": 3,
    },
    {
        "name": "robot",
        "display_name": "ByteBot 3000",
        "description": "A robot built for optimal algorithms and efficiency.",
        "sprite_key": "robot",
        "level_required": 1,
        "quests_required": [],
        "coin_cost": 100,
        "sort_order": 4,
    },
    {
        "name": "astronaut",
        "display_name": "Space Coder",
        "description": "Writes code that reaches for the stars.",
        "sprite_key": "astronaut",
        "level_required": 1,
        "quests_required": [7],  # Complete Danger Zone
        "coin_cost": 0,
        "sort_order": 5,
    },
    {
        "name": "dragon",
        "display_name": "Debug Dragon",
        "description": "Burns bugs with fiery determination.",
        "sprite_key": "dragon",
        "level_required": 7,
        "quests_required": [],
        "coin_cost": 250,
        "sort_order": 6,
    },
    {
        "name": "pirate",
        "display_name": "Captain Compile",
        "description": "Searches for coding treasure across the seven servers.",
        "sprite_key": "pirate",
        "level_required": 1,
        "quests_required": [12],  # Complete Treasure Hunt
        "coin_cost": 0,
        "sort_order": 7,
    },
    {
        "name": "alien",
        "display_name": "Xeno Coder",
        "description": "Writes code from another dimension. Unknown syntax, perfect results.",
        "sprite_key": "alien",
        "level_required": 10,
        "quests_required": [15],  # Complete Grand Finale
        "coin_cost": 0,
        "sort_order": 8,
    },
]


def seed_quests():
    """Seed quests linked to existing levels"""
    db = SessionLocal()
    try:
        existing = db.query(Quest).first()
        if existing:
            print("Quests already exist. Skipping quest seeding.")
            return

        # Get level mappings (if any levels exist, link quests to them)
        levels = db.query(Level).all()
        level_map = {l.slug: l.id for l in levels}

        # Map quest slugs to level slugs (adjust based on your actual levels)
        quest_to_level_map = {
            "quest-first-steps": "level-1-movement",
            "quest-turning-corners": "level-2-turns",
            "quest-coin-hunter": "level-3-coins",
        }

        for quest_data in SEED_QUESTS:
            # Try to link to existing level by matching slug pattern
            level_id = None
            mapped_level_slug = quest_to_level_map.get(quest_data["slug"])
            if mapped_level_slug and mapped_level_slug in level_map:
                level_id = level_map[mapped_level_slug]

            quest = Quest(
                slug=quest_data["slug"],
                title=quest_data["title"],
                description=quest_data["description"],
                difficulty=quest_data["difficulty"],
                xp_reward=quest_data["xp_reward"],
                coin_reward=quest_data["coin_reward"],
                node_x=quest_data["node_x"],
                node_y=quest_data["node_y"],
                level_requirement=quest_data["level_requirement"],
                prerequisite_quests=quest_data["prerequisite_quests"],
                level_id=level_id,
                star_thresholds=quest_data["star_thresholds"],
            )
            db.add(quest)
            print(f"Added quest: {quest_data['title']}")

        db.commit()
        print(f"\nSuccessfully seeded {len(SEED_QUESTS)} quests!")
    finally:
        db.close()


def seed_characters():
    """Seed characters"""
    db = SessionLocal()
    try:
        existing = db.query(Character).first()
        if existing:
            print("Characters already exist. Skipping character seeding.")
            return

        for char_data in SEED_CHARACTERS:
            char = Character(
                name=char_data["name"],
                display_name=char_data["display_name"],
                description=char_data["description"],
                sprite_key=char_data["sprite_key"],
                level_required=char_data["level_required"],
                quests_required=char_data["quests_required"],
                coin_cost=char_data["coin_cost"],
                sort_order=char_data["sort_order"],
            )
            db.add(char)
            print(f"Added character: {char_data['display_name']}")

        db.commit()
        print(f"\nSuccessfully seeded {len(SEED_CHARACTERS)} characters!")
    finally:
        db.close()


def main():
    print("=" * 50)
    print("Seeding Quest Map Data")
    print("=" * 50)
    print("\nSeeding quests...")
    seed_quests()
    print("\nSeeding characters...")
    seed_characters()
    print("\n" + "=" * 50)
    print("Done!")
    print("=" * 50)


if __name__ == "__main__":
    main()
