from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class WorldChest(Base):
    """Chest in the world"""
    __tablename__ = "world_chests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    chest_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    # Zone and position
    zone_id: Mapped[int] = mapped_column(ForeignKey("world_zones.id"), nullable=False)
    position_x: Mapped[int] = mapped_column(Integer, nullable=False)
    position_y: Mapped[int] = mapped_column(Integer, nullable=False)

    # Chest type: wooden, iron, golden, legendary
    chest_type: Mapped[str] = mapped_column(String(50), default="wooden")

    # Contents
    loot_table: Mapped[list] = mapped_column(JSON, default=list)  # [{item_id, quantity, chance}]
    coin_amount: Mapped[int] = mapped_column(Integer, default=0)

    # Lock settings
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    required_key_item_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Respawn settings
    is_one_time: Mapped[bool] = mapped_column(Boolean, default=True)
    respawn_time: Mapped[int] = mapped_column(Integer, default=0)  # Turns until respawn, 0 = never

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    zone: Mapped["WorldZone"] = relationship("WorldZone", back_populates="chests")
    player_progress: Mapped[list["ChestProgress"]] = relationship("ChestProgress", back_populates="chest")
