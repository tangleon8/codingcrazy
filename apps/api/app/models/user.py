from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey
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

    # Relationships
    progress: Mapped[list["Progress"]] = relationship("Progress", back_populates="user")
    quest_progress: Mapped[list["QuestProgress"]] = relationship("QuestProgress", back_populates="user")
    selected_character: Mapped["Character"] = relationship("Character", back_populates="users")
