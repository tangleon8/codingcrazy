from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Player progression fields
    player_level: Mapped[int] = mapped_column(Integer, default=1)
    current_xp: Mapped[int] = mapped_column(Integer, default=0)
    coins: Mapped[int] = mapped_column(Integer, default=0)
    selected_character_id: Mapped[int | None] = mapped_column(ForeignKey("characters.id"), nullable=True)

    # RPG Stats
    hp: Mapped[int] = mapped_column(Integer, default=100)
    max_hp: Mapped[int] = mapped_column(Integer, default=100)
    mp: Mapped[int] = mapped_column(Integer, default=50)
    max_mp: Mapped[int] = mapped_column(Integer, default=50)
    attack: Mapped[int] = mapped_column(Integer, default=10)
    defense: Mapped[int] = mapped_column(Integer, default=5)
    speed: Mapped[int] = mapped_column(Integer, default=5)
    crit_chance: Mapped[float] = mapped_column(Float, default=0.05)

    # World position
    current_zone_id: Mapped[int | None] = mapped_column(ForeignKey("world_zones.id"), nullable=True)
    world_x: Mapped[int] = mapped_column(Integer, default=25)
    world_y: Mapped[int] = mapped_column(Integer, default=25)

    # Equipment slots (store item IDs)
    equipped_weapon_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"), nullable=True)
    equipped_head_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"), nullable=True)
    equipped_chest_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"), nullable=True)
    equipped_legs_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"), nullable=True)
    equipped_feet_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"), nullable=True)
    equipped_accessory_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"), nullable=True)

    # Relationships
    progress: Mapped[list["Progress"]] = relationship("Progress", back_populates="user")
    selected_character: Mapped["Character"] = relationship("Character", back_populates="users")

    # New RPG relationships
    current_zone: Mapped["WorldZone"] = relationship("WorldZone", foreign_keys=[current_zone_id])
    inventory: Mapped[list["PlayerInventory"]] = relationship("PlayerInventory", back_populates="user")
    chest_progress: Mapped[list["ChestProgress"]] = relationship("ChestProgress", back_populates="user")

    # Equipment relationships
    equipped_weapon: Mapped["Item"] = relationship("Item", foreign_keys=[equipped_weapon_id])
    equipped_head: Mapped["Item"] = relationship("Item", foreign_keys=[equipped_head_id])
    equipped_chest: Mapped["Item"] = relationship("Item", foreign_keys=[equipped_chest_id])
    equipped_legs: Mapped["Item"] = relationship("Item", foreign_keys=[equipped_legs_id])
    equipped_feet: Mapped["Item"] = relationship("Item", foreign_keys=[equipped_feet_id])
    equipped_accessory: Mapped["Item"] = relationship("Item", foreign_keys=[equipped_accessory_id])
