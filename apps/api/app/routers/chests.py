import random
from fastapi import APIRouter, HTTPException
from app.core.deps import DbSession, CurrentUser
from app.models import WorldChest, ChestProgress, Item, PlayerInventory
from app.schemas.chest import (
    ChestInfo,
    OpenChestRequest,
    OpenChestResponse,
    LootItem,
)


router = APIRouter(prefix="/chests", tags=["chests"])


@router.get("/{chest_id}", response_model=ChestInfo)
def get_chest(chest_id: str, db: DbSession, current_user: CurrentUser):
    """Get chest information"""
    chest = db.query(WorldChest).filter(WorldChest.chest_id == chest_id).first()
    if not chest:
        raise HTTPException(status_code=404, detail="Chest not found")

    # Check if already opened by this user
    progress = db.query(ChestProgress).filter(
        ChestProgress.user_id == current_user.id,
        ChestProgress.chest_id == chest.id
    ).first()

    return ChestInfo(
        id=chest.chest_id,
        chest_type=chest.chest_type,
        position_x=chest.position_x,
        position_y=chest.position_y,
        is_locked=chest.is_locked,
        is_opened=progress is not None if chest.is_one_time else False,
        required_key=chest.required_key_item_id,
    )


@router.post("/open", response_model=OpenChestResponse)
def open_chest(data: OpenChestRequest, db: DbSession, current_user: CurrentUser):
    """Open a chest and receive loot"""
    chest = db.query(WorldChest).filter(WorldChest.chest_id == data.chest_id).first()
    if not chest:
        raise HTTPException(status_code=404, detail="Chest not found")

    # Check if already opened (for one-time chests)
    if chest.is_one_time:
        progress = db.query(ChestProgress).filter(
            ChestProgress.user_id == current_user.id,
            ChestProgress.chest_id == chest.id
        ).first()
        if progress:
            raise HTTPException(status_code=400, detail="Chest already opened")

    # Check if locked
    key_consumed = False
    key_name = None
    if chest.is_locked and chest.required_key_item_id:
        # Check if player has the key
        key_item = db.query(Item).filter(Item.item_id == chest.required_key_item_id).first()
        if not key_item:
            raise HTTPException(status_code=400, detail="Chest is locked")

        key_inv = db.query(PlayerInventory).filter(
            PlayerInventory.user_id == current_user.id,
            PlayerInventory.item_id == key_item.id
        ).first()

        if not key_inv or key_inv.quantity < 1:
            raise HTTPException(status_code=400, detail=f"You need a {key_item.name} to open this chest")

        # Consume key
        key_inv.quantity -= 1
        if key_inv.quantity <= 0:
            db.delete(key_inv)
        key_consumed = True
        key_name = key_item.name

    # Generate loot
    items_received = []
    for loot_entry in chest.loot_table or []:
        chance = loot_entry.get("chance", 1.0)
        if random.random() <= chance:
            item = db.query(Item).filter(Item.item_id == loot_entry.get("item_id")).first()
            if item:
                quantity = loot_entry.get("quantity", 1)

                # Add to inventory
                inv = db.query(PlayerInventory).filter(
                    PlayerInventory.user_id == current_user.id,
                    PlayerInventory.item_id == item.id
                ).first()

                if inv:
                    inv.quantity += quantity
                else:
                    inv = PlayerInventory(
                        user_id=current_user.id,
                        item_id=item.id,
                        quantity=quantity,
                    )
                    db.add(inv)

                items_received.append(LootItem(
                    item_id=item.item_id,
                    name=item.name,
                    quantity=quantity,
                    rarity=item.rarity,
                ))

    # Add gold
    gold_received = chest.coin_amount
    current_user.coins += gold_received

    # Record chest progress
    if chest.is_one_time:
        progress = ChestProgress(
            user_id=current_user.id,
            chest_id=chest.id,
        )
        db.add(progress)

    db.commit()

    # Build message
    if not items_received and gold_received == 0:
        message = "The chest was empty..."
    else:
        parts = []
        if gold_received > 0:
            parts.append(f"{gold_received} gold")
        for item in items_received:
            parts.append(f"{item.quantity}x {item.name}")
        message = f"Found: {', '.join(parts)}"

    return OpenChestResponse(
        success=True,
        message=message,
        gold_received=gold_received,
        items_received=items_received,
        key_consumed=key_consumed,
        key_name=key_name,
    )
