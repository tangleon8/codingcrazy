from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)  # "easy", "medium", "hard", "expert"

    # Rewards
    xp_reward: Mapped[int] = mapped_column(Integer, default=50)
    coin_reward: Mapped[int] = mapped_column(Integer, default=10)

    # Map positioning (0-1000 scale)
    node_x: Mapped[int] = mapped_column(Integer, nullable=False)
    node_y: Mapped[int] = mapped_column(Integer, nullable=False)

    # Unlock requirements
    level_requirement: Mapped[int] = mapped_column(Integer, default=1)
    prerequisite_quests: Mapped[list] = mapped_column(JSON, default=list)  # List of quest IDs

    # Link to existing level content (optional)
    level_id: Mapped[int | None] = mapped_column(ForeignKey("levels.id"), nullable=True)

    # Star thresholds for performance rating (action count thresholds)
    star_thresholds: Mapped[dict] = mapped_column(JSON, default=dict)  # {"1": 999, "2": 50, "3": 20}

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    level: Mapped["Level"] = relationship("Level", back_populates="quest")
    progress: Mapped[list["QuestProgress"]] = relationship("QuestProgress", back_populates="quest")
