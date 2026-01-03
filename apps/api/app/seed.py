"""Seed script to populate the database with initial levels"""

from app.core.database import SessionLocal, engine, Base
from app.models.level import Level
from app.models.user import User
from app.core.security import get_password_hash


# 5 levels with increasing difficulty
SEED_LEVELS = [
    {
        "slug": "first-steps",
        "title": "First Steps",
        "description": "Learn to move your hero! Use hero.move() to reach the goal.",
        "order_index": 1,
        "json_data": {
            "gridWidth": 5,
            "gridHeight": 5,
            "startPosition": {"x": 0, "y": 2},
            "goals": [{"x": 4, "y": 2}],
            "walls": [],
            "coins": [],
            "hazards": [],
            "allowedMethods": ["move"],
            "instructions": "# First Steps\n\nWelcome, young coder! Your hero needs to reach the green goal.\n\nUse `hero.move(direction)` to move. Directions are: `\"right\"`, `\"left\"`, `\"up\"`, `\"down\"`.\n\n**Goal:** Move right 4 times to reach the goal!",
            "starterCode": "// Move your hero to the goal!\n// Use: hero.move(\"right\")\n\nhero.move(\"right\");\nhero.move(\"right\");\n// Add more moves...\n",
            "winConditions": {
                "reachGoal": True,
                "collectAllCoins": False
            }
        }
    },
    {
        "slug": "turning-corners",
        "title": "Turning Corners",
        "description": "Navigate around obstacles to reach the goal.",
        "order_index": 2,
        "json_data": {
            "gridWidth": 6,
            "gridHeight": 6,
            "startPosition": {"x": 0, "y": 0},
            "goals": [{"x": 5, "y": 5}],
            "walls": [
                {"x": 2, "y": 0}, {"x": 2, "y": 1}, {"x": 2, "y": 2},
                {"x": 3, "y": 3}, {"x": 3, "y": 4}, {"x": 3, "y": 5}
            ],
            "coins": [],
            "hazards": [],
            "allowedMethods": ["move"],
            "instructions": "# Turning Corners\n\nWalls block your path! You can't walk through them.\n\nPlan your route carefully around the obstacles.\n\n**Goal:** Navigate around the walls to reach the goal.",
            "starterCode": "// Navigate around the walls!\n// The walls block certain paths.\n\nhero.move(\"right\");\nhero.move(\"right\");\n// Plan your route...\n",
            "winConditions": {
                "reachGoal": True,
                "collectAllCoins": False
            }
        }
    },
    {
        "slug": "coin-collector",
        "title": "Coin Collector",
        "description": "Collect all the coins and reach the goal!",
        "order_index": 3,
        "json_data": {
            "gridWidth": 7,
            "gridHeight": 5,
            "startPosition": {"x": 0, "y": 2},
            "goals": [{"x": 6, "y": 2}],
            "walls": [
                {"x": 3, "y": 0}, {"x": 3, "y": 1}, {"x": 3, "y": 3}, {"x": 3, "y": 4}
            ],
            "coins": [
                {"x": 1, "y": 0},
                {"x": 1, "y": 4},
                {"x": 5, "y": 0},
                {"x": 5, "y": 4}
            ],
            "hazards": [],
            "allowedMethods": ["move"],
            "instructions": "# Coin Collector\n\nGold coins have appeared! Collect them all before reaching the goal.\n\nWalk over a coin to collect it automatically.\n\n**Goal:** Collect all 4 coins AND reach the goal.",
            "starterCode": "// Collect all the coins!\n// You must visit each coin's position.\n\n// Plan an efficient route that:\n// 1. Collects all coins\n// 2. Ends at the goal\n\nhero.move(\"up\");\n// Continue your path...\n",
            "winConditions": {
                "reachGoal": True,
                "collectAllCoins": True
            }
        }
    },
    {
        "slug": "loop-the-loop",
        "title": "Loop the Loop",
        "description": "Use a for loop to write less code!",
        "order_index": 4,
        "json_data": {
            "gridWidth": 10,
            "gridHeight": 3,
            "startPosition": {"x": 0, "y": 1},
            "goals": [{"x": 9, "y": 1}],
            "walls": [],
            "coins": [
                {"x": 1, "y": 1}, {"x": 2, "y": 1}, {"x": 3, "y": 1}, {"x": 4, "y": 1},
                {"x": 5, "y": 1}, {"x": 6, "y": 1}, {"x": 7, "y": 1}, {"x": 8, "y": 1}
            ],
            "hazards": [],
            "allowedMethods": ["move"],
            "instructions": "# Loop the Loop\n\nWriting `hero.move(\"right\")` 9 times is tedious!\n\nUse a **for loop** to repeat actions:\n\n```javascript\nfor (let i = 0; i < 5; i++) {\n  hero.move(\"right\");\n}\n```\n\nThis moves right 5 times!\n\n**Goal:** Use a loop to reach the goal.",
            "starterCode": "// Use a for loop to move efficiently!\n\nfor (let i = 0; i < 3; i++) {\n  hero.move(\"right\");\n}\n\n// Modify the loop to collect all coins and reach the goal\n",
            "winConditions": {
                "reachGoal": True,
                "collectAllCoins": True
            }
        }
    },
    {
        "slug": "danger-zone",
        "title": "Danger Zone",
        "description": "Avoid the hazards! Timing is everything.",
        "order_index": 5,
        "json_data": {
            "gridWidth": 8,
            "gridHeight": 5,
            "startPosition": {"x": 0, "y": 2},
            "goals": [{"x": 7, "y": 2}],
            "walls": [
                {"x": 2, "y": 0}, {"x": 2, "y": 4},
                {"x": 5, "y": 0}, {"x": 5, "y": 4}
            ],
            "coins": [
                {"x": 3, "y": 2},
                {"x": 6, "y": 2}
            ],
            "hazards": [
                {"x": 2, "y": 2, "pattern": "toggle", "activeFrames": [0, 2, 4], "type": "spike"},
                {"x": 5, "y": 2, "pattern": "toggle", "activeFrames": [1, 3, 5], "type": "spike"}
            ],
            "allowedMethods": ["move", "wait"],
            "instructions": "# Danger Zone\n\nSpikes appear and disappear! Red tiles are dangerous.\n\nUse `hero.wait()` to skip a turn and let hazards cycle.\n\n**Tip:** Watch the pattern - spikes toggle every turn!\n\n**Goal:** Avoid hazards, collect coins, reach the goal.",
            "starterCode": "// Hazards toggle on/off each turn!\n// Use hero.wait() to pause and let them change.\n\nhero.move(\"right\");\nhero.move(\"right\");\n\n// The spike at (2,2) is active on turns 0, 2, 4...\n// It's safe on turns 1, 3, 5...\n\n// Think about timing!\n",
            "winConditions": {
                "reachGoal": True,
                "collectAllCoins": True
            }
        }
    }
]


def seed_levels():
    """Seed the database with initial levels"""
    db = SessionLocal()
    try:
        # Check if levels already exist
        existing = db.query(Level).first()
        if existing:
            print("Levels already exist. Skipping seed.")
            return

        for level_data in SEED_LEVELS:
            level = Level(**level_data)
            db.add(level)
            print(f"Added level: {level_data['title']}")

        db.commit()
        print(f"\nSuccessfully seeded {len(SEED_LEVELS)} levels!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding levels: {e}")
        raise
    finally:
        db.close()


def seed_admin_user():
    """Create an admin user for testing"""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@codingcrazy.dev").first()
        if existing:
            print("Admin user already exists. Skipping.")
            return

        admin = User(
            email="admin@codingcrazy.dev",
            password_hash=get_password_hash("adminpass123"),
            is_admin=True
        )
        db.add(admin)
        db.commit()
        print("Created admin user: admin@codingcrazy.dev / adminpass123")
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
    finally:
        db.close()


def main():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    print("\nSeeding levels...")
    seed_levels()

    print("\nCreating admin user...")
    seed_admin_user()

    print("\nDone!")


if __name__ == "__main__":
    main()
