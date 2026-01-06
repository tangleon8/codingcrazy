from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Item(Base):
    """Item definition"""
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    item_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Item type: weapon, armor, consumable, key, quest, material
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)
    rarity: Mapped[str] = mapped_column(String(20), default="common")

    # Stacking
    stackable: Mapped[bool] = mapped_column(Boolean, default=True)
    max_stack: Mapped[int] = mapped_column(Integer, default=99)

    # Value
    buy_price: Mapped[int] = mapped_column(Integer, default=0)
    sell_price: Mapped[int] = mapped_column(Integer, default=0)

    # Equipment stats (for weapons/armor)
    attack_bonus: Mapped[int] = mapped_column(Integer, default=0)
    defense_bonus: Mapped[int] = mapped_column(Integer, default=0)
    hp_bonus: Mapped[int] = mapped_column(Integer, default=0)
    crit_bonus: Mapped[float] = mapped_column(Float, default=0.0)

    # Equipment slot (weapon, head, chest, legs, feet, accessory)
    equip_slot: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Weapon type (sword, axe, bow, staff, dagger)
    weapon_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    weapon_range: Mapped[int] = mapped_column(Integer, default=1)

    # Consumable effect
    effect_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # heal, mana, buff_attack, etc.
    effect_value: Mapped[int] = mapped_column(Integer, default=0)
    effect_duration: Mapped[int] = mapped_column(Integer, default=0)

    # Visual
    sprite_key: Mapped[str] = mapped_column(String(100), nullable=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    inventory_items: Mapped[list["PlayerInventory"]] = relationship("PlayerInventory", back_populates="item")
