from fastapi import APIRouter, HTTPException
from app.core.deps import DbSession, CurrentUser
from app.models import Item, PlayerInventory, User
from app.schemas.inventory import (
    InventoryResponse,
    ItemInfo,
    EquippedItems,
    UseItemRequest,
    UseItemResponse,
    EquipItemRequest,
    EquipItemResponse,
    UnequipRequest,
    UnequipResponse,
    DropItemRequest,
    DropItemResponse,
)


router = APIRouter(prefix="/inventory", tags=["inventory"])


def item_to_info(item: Item, quantity: int, is_equipped: bool) -> ItemInfo:
    """Convert database Item to ItemInfo schema"""
    return ItemInfo(
        id=item.item_id,
        name=item.name,
        description=item.description,
        item_type=item.item_type,
        rarity=item.rarity,
        quantity=quantity,
        is_equipped=is_equipped,
        equip_slot=item.equip_slot,
        attack_bonus=item.attack_bonus,
        defense_bonus=item.defense_bonus,
        hp_bonus=item.hp_bonus,
        effect_type=item.effect_type,
        effect_value=item.effect_value,
        buy_price=item.buy_price,
        sell_price=item.sell_price,
        sprite_key=item.sprite_key,
    )


@router.get("/", response_model=InventoryResponse)
def get_inventory(db: DbSession, current_user: CurrentUser):
    """Get player's full inventory"""
    # Get all inventory items
    inv_items = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id
    ).all()

    items = []
    for inv in inv_items:
        item = db.query(Item).filter(Item.id == inv.item_id).first()
        if item:
            items.append(item_to_info(item, inv.quantity, inv.is_equipped))

    # Get equipped items
    equipped = EquippedItems(
        weapon=None,
        head=None,
        chest=None,
        legs=None,
        feet=None,
        accessory=None,
    )

    if current_user.equipped_weapon_id:
        weapon = db.query(Item).filter(Item.id == current_user.equipped_weapon_id).first()
        if weapon:
            equipped.weapon = item_to_info(weapon, 1, True)

    if current_user.equipped_head_id:
        head = db.query(Item).filter(Item.id == current_user.equipped_head_id).first()
        if head:
            equipped.head = item_to_info(head, 1, True)

    if current_user.equipped_chest_id:
        chest = db.query(Item).filter(Item.id == current_user.equipped_chest_id).first()
        if chest:
            equipped.chest = item_to_info(chest, 1, True)

    if current_user.equipped_legs_id:
        legs = db.query(Item).filter(Item.id == current_user.equipped_legs_id).first()
        if legs:
            equipped.legs = item_to_info(legs, 1, True)

    if current_user.equipped_feet_id:
        feet = db.query(Item).filter(Item.id == current_user.equipped_feet_id).first()
        if feet:
            equipped.feet = item_to_info(feet, 1, True)

    if current_user.equipped_accessory_id:
        accessory = db.query(Item).filter(Item.id == current_user.equipped_accessory_id).first()
        if accessory:
            equipped.accessory = item_to_info(accessory, 1, True)

    return InventoryResponse(
        items=items,
        equipped=equipped,
        gold=current_user.coins,
        max_slots=30,
        used_slots=len(items),
    )


@router.post("/use", response_model=UseItemResponse)
def use_item(data: UseItemRequest, db: DbSession, current_user: CurrentUser):
    """Use a consumable item"""
    item = db.query(Item).filter(Item.item_id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    inv = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id,
        PlayerInventory.item_id == item.id
    ).first()
    if not inv or inv.quantity < 1:
        raise HTTPException(status_code=400, detail="Item not in inventory")

    if item.item_type != "consumable":
        raise HTTPException(status_code=400, detail="Item is not consumable")

    hp_restored = 0
    mp_restored = 0
    effect_applied = None

    if item.effect_type == "heal":
        hp_restored = min(item.effect_value, current_user.max_hp - current_user.hp)
        current_user.hp += hp_restored
    elif item.effect_type == "mana":
        mp_restored = min(item.effect_value, current_user.max_mp - current_user.mp)
        current_user.mp += mp_restored
    elif item.effect_type in ["buff_attack", "buff_defense"]:
        effect_applied = item.effect_type

    # Consume item
    inv.quantity -= 1
    if inv.quantity <= 0:
        db.delete(inv)

    db.commit()

    return UseItemResponse(
        success=True,
        message=f"Used {item.name}",
        hp_restored=hp_restored,
        mp_restored=mp_restored,
        effect_applied=effect_applied,
        item_consumed=True,
        remaining_quantity=max(0, inv.quantity if inv else 0),
    )


@router.post("/equip", response_model=EquipItemResponse)
def equip_item(data: EquipItemRequest, db: DbSession, current_user: CurrentUser):
    """Equip a weapon or armor"""
    item = db.query(Item).filter(Item.item_id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    inv = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id,
        PlayerInventory.item_id == item.id
    ).first()
    if not inv:
        raise HTTPException(status_code=400, detail="Item not in inventory")

    if item.item_type not in ["weapon", "armor"]:
        raise HTTPException(status_code=400, detail="Item cannot be equipped")

    slot = item.equip_slot
    if not slot:
        raise HTTPException(status_code=400, detail="Item has no equip slot")

    previous_item = None

    # Unequip current item in slot
    slot_attr = f"equipped_{slot}_id"
    current_equipped_id = getattr(current_user, slot_attr, None)
    if current_equipped_id:
        current_item = db.query(Item).filter(Item.id == current_equipped_id).first()
        if current_item:
            previous_item = item_to_info(current_item, 1, False)

    # Equip new item
    setattr(current_user, slot_attr, item.id)
    inv.is_equipped = True
    db.commit()

    return EquipItemResponse(
        success=True,
        message=f"Equipped {item.name}",
        slot=slot,
        previous_item=previous_item,
        new_stats={
            "attack": current_user.attack + item.attack_bonus,
            "defense": current_user.defense + item.defense_bonus,
        },
    )


@router.post("/unequip", response_model=UnequipResponse)
def unequip_item(data: UnequipRequest, db: DbSession, current_user: CurrentUser):
    """Unequip an item from a slot"""
    slot_attr = f"equipped_{data.slot}_id"
    current_equipped_id = getattr(current_user, slot_attr, None)

    if not current_equipped_id:
        raise HTTPException(status_code=400, detail="Nothing equipped in that slot")

    item = db.query(Item).filter(Item.id == current_equipped_id).first()

    # Unequip
    setattr(current_user, slot_attr, None)

    # Update inventory
    inv = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id,
        PlayerInventory.item_id == current_equipped_id
    ).first()
    if inv:
        inv.is_equipped = False

    db.commit()

    return UnequipResponse(
        success=True,
        message=f"Unequipped {item.name if item else 'item'}",
        unequipped_item=item_to_info(item, 1, False) if item else None,
    )


@router.post("/drop", response_model=DropItemResponse)
def drop_item(data: DropItemRequest, db: DbSession, current_user: CurrentUser):
    """Drop an item from inventory"""
    item = db.query(Item).filter(Item.item_id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    inv = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id,
        PlayerInventory.item_id == item.id
    ).first()
    if not inv or inv.quantity < data.quantity:
        raise HTTPException(status_code=400, detail="Not enough items")

    # Check if equipped
    if inv.is_equipped:
        raise HTTPException(status_code=400, detail="Cannot drop equipped items")

    dropped = min(data.quantity, inv.quantity)
    inv.quantity -= dropped

    if inv.quantity <= 0:
        db.delete(inv)

    db.commit()

    return DropItemResponse(
        success=True,
        message=f"Dropped {dropped}x {item.name}",
        dropped_quantity=dropped,
        remaining_quantity=max(0, inv.quantity if inv else 0),
    )
