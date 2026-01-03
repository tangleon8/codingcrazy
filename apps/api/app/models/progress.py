from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Progress(Base):
    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id"), nullable=False, index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    best_run_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Unique constraint for user_id + level_id
    __table_args__ = (
        UniqueConstraint("user_id", "level_id", name="uq_user_level"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="progress")
    level: Mapped["Level"] = relationship("Level", back_populates="progress")
