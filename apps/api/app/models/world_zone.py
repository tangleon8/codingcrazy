from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class WorldZone(Base):
    """A zone/area in the game world"""
    __tablename__ = "world_zones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Zone dimensions
    width: Mapped[int] = mapped_column(Integer, default=50)
    height: Mapped[int] = mapped_column(Integer, default=50)

    # Zone data (terrain, collision map, decorations)
    terrain_data: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Player spawn point
    spawn_x: Mapped[int] = mapped_column(Integer, default=25)
    spawn_y: Mapped[int] = mapped_column(Integer, default=25)

    # Zone connections (portals to other zones)
    connections: Mapped[list] = mapped_column(JSON, default=list)

    # Zone settings
    is_starting_zone: Mapped[bool] = mapped_column(Boolean, default=False)
    level_requirement: Mapped[int] = mapped_column(Integer, default=1)
    enemy_level_min: Mapped[int] = mapped_column(Integer, default=1)
    enemy_level_max: Mapped[int] = mapped_column(Integer, default=5)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    enemy_spawns: Mapped[list["EnemySpawn"]] = relationship("EnemySpawn", back_populates="zone")
    npcs: Mapped[list["NPC"]] = relationship("NPC", back_populates="zone")
    chests: Mapped[list["WorldChest"]] = relationship("WorldChest", back_populates="zone")
