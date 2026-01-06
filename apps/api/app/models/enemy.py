from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Enemy(Base):
    """Enemy type definition"""
    __tablename__ = "enemies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    enemy_type: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Base stats (scaled by level)
    base_hp: Mapped[int] = mapped_column(Integer, default=50)
    base_attack: Mapped[int] = mapped_column(Integer, default=10)
    base_defense: Mapped[int] = mapped_column(Integer, default=5)
    base_speed: Mapped[int] = mapped_column(Integer, default=5)

    # Combat properties
    crit_chance: Mapped[float] = mapped_column(Float, default=0.05)
    aggro_range: Mapped[int] = mapped_column(Integer, default=3)

    # Rewards
    xp_reward: Mapped[int] = mapped_column(Integer, default=25)
    coin_reward: Mapped[int] = mapped_column(Integer, default=10)
    loot_table: Mapped[list] = mapped_column(JSON, default=list)

    # Behavior
    movement_pattern: Mapped[str] = mapped_column(String(50), default="stationary")
    is_boss: Mapped[bool] = mapped_column(Integer, default=False)

    # Visual
    sprite_key: Mapped[str] = mapped_column(String(100), nullable=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    spawns: Mapped[list["EnemySpawn"]] = relationship("EnemySpawn", back_populates="enemy")
