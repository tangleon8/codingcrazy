from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class QuestProgress(Base):
    __tablename__ = "quest_progress"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"), nullable=False, index=True)

    stars_earned: Mapped[int] = mapped_column(Integer, default=0)  # 0-3 stars
    best_action_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "quest_id", name="uq_user_quest"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="quest_progress")
    quest: Mapped["Quest"] = relationship("Quest", back_populates="progress")
