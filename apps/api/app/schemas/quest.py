from datetime import datetime
from pydantic import BaseModel


class QuestNode(BaseModel):
    """Quest data for map display"""
    id: int
    slug: str
    title: str
    description: str | None
    difficulty: str
    xp_reward: int
    coin_reward: int
    node_x: int
    node_y: int
    level_requirement: int
    prerequisite_quests: list[int]
    level_id: int | None

    class Config:
        from_attributes = True


class QuestMapItem(BaseModel):
    """Quest with user-specific status"""
    quest: QuestNode
    status: str  # "locked", "unlocked", "completed"
    stars_earned: int
    attempts: int
    is_playable: bool


class QuestMapResponse(BaseModel):
    quests: list[QuestMapItem]
    connections: list[tuple[int, int]]  # List of (from_quest_id, to_quest_id)


class QuestDetailResponse(BaseModel):
    quest: QuestNode
    status: str
    stars_earned: int
    best_action_count: int | None
    attempts: int
    completed_at: datetime | None
    level_slug: str | None


class CompleteQuestRequest(BaseModel):
    quest_id: int
    action_count: int
    coins_collected: int = 0


class CompleteQuestResponse(BaseModel):
    success: bool
    stars_earned: int
    xp_gained: int
    coins_gained: int
    leveled_up: bool
    new_level: int | None
