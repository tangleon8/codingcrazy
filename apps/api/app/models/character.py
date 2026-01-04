from sqlalchemy import String, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sprite_key: Mapped[str] = mapped_column(String(100), nullable=False)  # Key for frontend sprite lookup

    # Unlock requirements
    level_required: Mapped[int] = mapped_column(Integer, default=1)
    quests_required: Mapped[list] = mapped_column(JSON, default=list)  # List of quest IDs
    coin_cost: Mapped[int] = mapped_column(Integer, default=0)

    # Display order
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="selected_character")
