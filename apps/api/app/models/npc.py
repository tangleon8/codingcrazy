from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class NPC(Base):
    """NPC definition"""
    __tablename__ = "npcs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    npc_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Zone and position
    zone_id: Mapped[int] = mapped_column(ForeignKey("world_zones.id"), nullable=False)
    position_x: Mapped[int] = mapped_column(Integer, nullable=False)
    position_y: Mapped[int] = mapped_column(Integer, nullable=False)

    # NPC type: merchant, quest_giver, trainer, villager
    npc_type: Mapped[str] = mapped_column(String(50), default="villager")

    # Dialogue data
    dialogue_tree: Mapped[dict] = mapped_column(JSON, default=dict)

    # Shop settings
    is_shopkeeper: Mapped[bool] = mapped_column(Boolean, default=False)
    shop_items: Mapped[list] = mapped_column(JSON, default=list)  # [{item_id, price, stock}]

    # Visual
    sprite_key: Mapped[str] = mapped_column(String(100), nullable=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    zone: Mapped["WorldZone"] = relationship("WorldZone", back_populates="npcs")
