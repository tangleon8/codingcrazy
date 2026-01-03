from datetime import datetime
from typing import Any
from pydantic import BaseModel


class LevelBase(BaseModel):
    slug: str
    title: str
    description: str | None = None


class LevelCreate(LevelBase):
    order_index: int
    json_data: dict[str, Any]


class LevelUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order_index: int | None = None
    json_data: dict[str, Any] | None = None


class LevelResponse(LevelBase):
    id: int
    order_index: int
    json_data: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LevelListItem(LevelBase):
    """Level info for listing (without full JSON data)"""
    id: int
    order_index: int

    class Config:
        from_attributes = True


class LevelJsonSchema(BaseModel):
    """Schema for level JSON data validation"""
    gridWidth: int
    gridHeight: int
    startPosition: dict[str, int]  # {"x": 0, "y": 0}
    goals: list[dict[str, int]]  # [{"x": 5, "y": 5}]
    walls: list[dict[str, int]] = []
    coins: list[dict[str, int]] = []
    hazards: list[dict[str, Any]] = []
    allowedMethods: list[str] = ["move", "wait"]
    instructions: str
    starterCode: str
    winConditions: dict[str, Any]  # {"reachGoal": true, "collectAllCoins": false}
