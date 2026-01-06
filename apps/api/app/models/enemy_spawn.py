from sqlalchemy import Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class EnemySpawn(Base):
    """Enemy spawn configuration in a zone"""
    __tablename__ = "enemy_spawns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("world_zones.id"), nullable=False)
    enemy_id: Mapped[int] = mapped_column(ForeignKey("enemies.id"), nullable=False)

    # Spawn position
    spawn_x: Mapped[int] = mapped_column(Integer, nullable=False)
    spawn_y: Mapped[int] = mapped_column(Integer, nullable=False)

    # Level scaling
    level_min: Mapped[int] = mapped_column(Integer, default=1)
    level_max: Mapped[int] = mapped_column(Integer, default=5)

    # Respawn settings
    respawn_time: Mapped[int] = mapped_column(Integer, default=300)  # Turns until respawn
    is_boss: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    zone: Mapped["WorldZone"] = relationship("WorldZone", back_populates="enemy_spawns")
    enemy: Mapped["Enemy"] = relationship("Enemy", back_populates="spawns")
