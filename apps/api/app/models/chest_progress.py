from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ChestProgress(Base):
    """Track opened chests per user"""
    __tablename__ = "chest_progress"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    chest_id: Mapped[int] = mapped_column(ForeignKey("world_chests.id"), nullable=False)

    # When the chest was opened
    opened_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "chest_id", name="uq_user_chest"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chest_progress")
    chest: Mapped["WorldChest"] = relationship("WorldChest", back_populates="player_progress")
