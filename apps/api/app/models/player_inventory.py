from sqlalchemy import Integer, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PlayerInventory(Base):
    """Player's inventory items"""
    __tablename__ = "player_inventory"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), nullable=False)

    # Quantity
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    # Equipment state
    is_equipped: Mapped[bool] = mapped_column(Boolean, default=False)
    equip_slot: Mapped[str | None] = mapped_column(Integer, nullable=True)

    # Inventory position (for UI ordering)
    slot_position: Mapped[int | None] = mapped_column(Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_user_item"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="inventory")
    item: Mapped["Item"] = relationship("Item", back_populates="inventory_items")
