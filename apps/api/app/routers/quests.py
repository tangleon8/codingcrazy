from datetime import datetime
from fastapi import APIRouter, HTTPException, status

from app.core.deps import DbSession, CurrentUser
from app.models.quest import Quest
from app.models.quest_progress import QuestProgress
from app.models.level import Level
from app.schemas.quest import (
    QuestMapResponse,
    QuestMapItem,
    QuestNode,
    QuestDetailResponse,
    CompleteQuestRequest,
    CompleteQuestResponse,
)
from app.schemas.progression import calculate_xp_to_next_level


router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("/map", response_model=QuestMapResponse)
def get_quest_map(db: DbSession, current_user: CurrentUser):
    """Get all quests with user status for the map"""
    quests = db.query(Quest).all()
    progress_records = db.query(QuestProgress).filter(
        QuestProgress.user_id == current_user.id
    ).all()
    progress_map = {p.quest_id: p for p in progress_records}

    # Build set of completed quest IDs
    completed_quest_ids = {
        qid for qid, p in progress_map.items() if p.completed_at is not None
    }

    result = []
    connections = []

    for quest in quests:
        progress = progress_map.get(quest.id)

        # Determine status
        prereqs_met = all(pid in completed_quest_ids for pid in (quest.prerequisite_quests or []))
        level_met = current_user.player_level >= quest.level_requirement

        if progress and progress.completed_at:
            quest_status = "completed"
        elif prereqs_met and level_met:
            quest_status = "unlocked"
        else:
            quest_status = "locked"

        result.append(QuestMapItem(
            quest=QuestNode(
                id=quest.id,
                slug=quest.slug,
                title=quest.title,
                description=quest.description,
                difficulty=quest.difficulty,
                xp_reward=quest.xp_reward,
                coin_reward=quest.coin_reward,
                node_x=quest.node_x,
                node_y=quest.node_y,
                level_requirement=quest.level_requirement,
                prerequisite_quests=quest.prerequisite_quests or [],
                level_id=quest.level_id,
            ),
            status=quest_status,
            stars_earned=progress.stars_earned if progress else 0,
            attempts=progress.attempts if progress else 0,
            is_playable=quest_status in ("unlocked", "completed"),
        ))

        # Build connections from prerequisites
        for prereq_id in (quest.prerequisite_quests or []):
            connections.append((prereq_id, quest.id))

    return QuestMapResponse(quests=result, connections=connections)


@router.get("/{quest_id}", response_model=QuestDetailResponse)
def get_quest_detail(quest_id: int, db: DbSession, current_user: CurrentUser):
    """Get detailed quest info including level slug"""
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    progress = db.query(QuestProgress).filter(
        QuestProgress.user_id == current_user.id,
        QuestProgress.quest_id == quest_id
    ).first()

    level_slug = None
    if quest.level_id:
        level = db.query(Level).filter(Level.id == quest.level_id).first()
        level_slug = level.slug if level else None

    # Determine status
    completed_quests = {
        p.quest_id for p in db.query(QuestProgress).filter(
            QuestProgress.user_id == current_user.id,
            QuestProgress.completed_at.isnot(None)
        ).all()
    }
    prereqs_met = all(pid in completed_quests for pid in (quest.prerequisite_quests or []))
    level_met = current_user.player_level >= quest.level_requirement

    if progress and progress.completed_at:
        quest_status = "completed"
    elif prereqs_met and level_met:
        quest_status = "unlocked"
    else:
        quest_status = "locked"

    return QuestDetailResponse(
        quest=QuestNode(
            id=quest.id,
            slug=quest.slug,
            title=quest.title,
            description=quest.description,
            difficulty=quest.difficulty,
            xp_reward=quest.xp_reward,
            coin_reward=quest.coin_reward,
            node_x=quest.node_x,
            node_y=quest.node_y,
            level_requirement=quest.level_requirement,
            prerequisite_quests=quest.prerequisite_quests or [],
            level_id=quest.level_id,
        ),
        status=quest_status,
        stars_earned=progress.stars_earned if progress else 0,
        best_action_count=progress.best_action_count if progress else None,
        attempts=progress.attempts if progress else 0,
        completed_at=progress.completed_at if progress else None,
        level_slug=level_slug,
    )


@router.post("/complete", response_model=CompleteQuestResponse)
def complete_quest(data: CompleteQuestRequest, db: DbSession, current_user: CurrentUser):
    """Complete a quest and award XP/coins"""
    quest = db.query(Quest).filter(Quest.id == data.quest_id).first()
    if not quest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quest not found")

    # Calculate stars based on action count
    thresholds = quest.star_thresholds or {"1": 999, "2": 50, "3": 20}
    stars = 1
    if data.action_count <= int(thresholds.get("3", 20)):
        stars = 3
    elif data.action_count <= int(thresholds.get("2", 50)):
        stars = 2

    # Get or create progress
    progress = db.query(QuestProgress).filter(
        QuestProgress.user_id == current_user.id,
        QuestProgress.quest_id == data.quest_id
    ).first()

    is_first_completion = progress is None or progress.completed_at is None

    if not progress:
        progress = QuestProgress(
            user_id=current_user.id,
            quest_id=data.quest_id,
            stars_earned=stars,
            best_action_count=data.action_count,
            attempts=1,
            completed_at=datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.attempts += 1
        if progress.completed_at is None:
            progress.completed_at = datetime.utcnow()
        if stars > progress.stars_earned:
            progress.stars_earned = stars
        if progress.best_action_count is None or data.action_count < progress.best_action_count:
            progress.best_action_count = data.action_count

    # Award XP and coins only on first completion
    xp_gained = 0
    coins_gained = 0
    leveled_up = False
    new_level = None

    if is_first_completion:
        xp_gained = quest.xp_reward
        coins_gained = quest.coin_reward

        current_user.current_xp += xp_gained
        current_user.coins += coins_gained

        # Check for level up
        xp_needed = calculate_xp_to_next_level(current_user.player_level)
        while current_user.current_xp >= xp_needed:
            current_user.current_xp -= xp_needed
            current_user.player_level += 1
            leveled_up = True
            new_level = current_user.player_level
            xp_needed = calculate_xp_to_next_level(current_user.player_level)

    db.commit()

    return CompleteQuestResponse(
        success=True,
        stars_earned=stars,
        xp_gained=xp_gained,
        coins_gained=coins_gained,
        leveled_up=leveled_up,
        new_level=new_level,
    )
