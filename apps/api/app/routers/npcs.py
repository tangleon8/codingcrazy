from fastapi import APIRouter, HTTPException
from app.core.deps import DbSession, CurrentUser
from app.models import NPC, Item, PlayerInventory
from app.schemas.npc import (
    NPCInfo,
    NPCDialogueResponse,
    DialogueNode,
    DialogueOption,
    DialogueSelectRequest,
    DialogueSelectResponse,
    ShopInventoryResponse,
    ShopItem,
    BuyItemRequest,
    BuyItemResponse,
    SellItemRequest,
    SellItemResponse,
)


router = APIRouter(prefix="/npcs", tags=["npcs"])


@router.get("/{npc_id}", response_model=NPCInfo)
def get_npc(npc_id: str, db: DbSession, current_user: CurrentUser):
    """Get NPC information"""
    npc = db.query(NPC).filter(NPC.npc_id == npc_id).first()
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")

    return NPCInfo(
        id=npc.npc_id,
        name=npc.name,
        display_name=npc.display_name,
        npc_type=npc.npc_type,
        position_x=npc.position_x,
        position_y=npc.position_y,
        is_shopkeeper=npc.is_shopkeeper,
        sprite_key=npc.sprite_key,
    )


@router.get("/{npc_id}/dialogue", response_model=NPCDialogueResponse)
def get_dialogue(npc_id: str, db: DbSession, current_user: CurrentUser):
    """Get NPC dialogue starting node"""
    npc = db.query(NPC).filter(NPC.npc_id == npc_id).first()
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")

    dialogue_tree = npc.dialogue_tree or {}
    start_node_id = dialogue_tree.get("start_node", "start")
    nodes = dialogue_tree.get("nodes", {})

    if start_node_id not in nodes:
        # Default dialogue
        current_node = DialogueNode(
            text=f"Hello, traveler! I'm {npc.display_name}.",
            options=[DialogueOption(text="Goodbye", next_node=None, action_type=None)]
        )
    else:
        node_data = nodes[start_node_id]
        current_node = DialogueNode(
            text=node_data.get("text", "..."),
            options=[
                DialogueOption(
                    text=opt.get("text", "..."),
                    next_node=opt.get("next_node"),
                    action_type=opt.get("action_type"),
                )
                for opt in node_data.get("options", [])
            ]
        )

    return NPCDialogueResponse(
        npc=NPCInfo(
            id=npc.npc_id,
            name=npc.name,
            display_name=npc.display_name,
            npc_type=npc.npc_type,
            position_x=npc.position_x,
            position_y=npc.position_y,
            is_shopkeeper=npc.is_shopkeeper,
            sprite_key=npc.sprite_key,
        ),
        current_node=current_node,
        dialogue_history=[start_node_id],
    )


@router.post("/{npc_id}/dialogue/respond", response_model=DialogueSelectResponse)
def respond_to_dialogue(
    npc_id: str,
    data: DialogueSelectRequest,
    db: DbSession,
    current_user: CurrentUser
):
    """Select a dialogue option"""
    npc = db.query(NPC).filter(NPC.npc_id == npc_id).first()
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")

    # For simplicity, we'll handle basic dialogue flow
    # In a real implementation, you'd track dialogue state per user

    dialogue_tree = npc.dialogue_tree or {}
    nodes = dialogue_tree.get("nodes", {})

    # Get current node options
    # For now, assume we're selecting from the start node
    start_node = nodes.get("start", {})
    options = start_node.get("options", [])

    if data.option_index < 0 or data.option_index >= len(options):
        raise HTTPException(status_code=400, detail="Invalid option")

    selected = options[data.option_index]
    next_node_id = selected.get("next_node")
    action_type = selected.get("action_type")

    next_node = None
    shop_opened = False

    if action_type == "open_shop":
        shop_opened = True

    if next_node_id and next_node_id in nodes:
        next_data = nodes[next_node_id]
        next_node = DialogueNode(
            text=next_data.get("text", "..."),
            options=[
                DialogueOption(
                    text=opt.get("text", "..."),
                    next_node=opt.get("next_node"),
                    action_type=opt.get("action_type"),
                )
                for opt in next_data.get("options", [])
            ]
        )

    return DialogueSelectResponse(
        success=True,
        message=selected.get("text", "..."),
        next_node=next_node,
        conversation_ended=next_node_id is None,
        action_triggered=action_type,
        shop_opened=shop_opened,
    )


@router.get("/{npc_id}/shop", response_model=ShopInventoryResponse)
def get_shop(npc_id: str, db: DbSession, current_user: CurrentUser):
    """Get merchant's shop inventory"""
    npc = db.query(NPC).filter(NPC.npc_id == npc_id).first()
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")

    if not npc.is_shopkeeper:
        raise HTTPException(status_code=400, detail="NPC is not a merchant")

    shop_items = []
    for shop_item in npc.shop_items or []:
        item = db.query(Item).filter(Item.item_id == shop_item.get("item_id")).first()
        if item:
            shop_items.append(ShopItem(
                item_id=item.item_id,
                name=item.name,
                description=item.description,
                item_type=item.item_type,
                rarity=item.rarity,
                price=shop_item.get("price", item.buy_price),
                stock=shop_item.get("stock", -1),
                attack_bonus=item.attack_bonus,
                defense_bonus=item.defense_bonus,
                effect_type=item.effect_type,
                effect_value=item.effect_value,
                sprite_key=item.sprite_key,
            ))

    return ShopInventoryResponse(
        npc_id=npc.npc_id,
        npc_name=npc.display_name,
        items=shop_items,
        player_gold=current_user.coins,
    )


@router.post("/{npc_id}/shop/buy", response_model=BuyItemResponse)
def buy_item(npc_id: str, data: BuyItemRequest, db: DbSession, current_user: CurrentUser):
    """Purchase an item from a merchant"""
    npc = db.query(NPC).filter(NPC.npc_id == npc_id).first()
    if not npc or not npc.is_shopkeeper:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Find item in shop
    shop_item_data = None
    for si in npc.shop_items or []:
        if si.get("item_id") == data.item_id:
            shop_item_data = si
            break

    if not shop_item_data:
        raise HTTPException(status_code=404, detail="Item not for sale")

    item = db.query(Item).filter(Item.item_id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    price = shop_item_data.get("price", item.buy_price)
    total_cost = price * data.quantity

    if current_user.coins < total_cost:
        raise HTTPException(status_code=400, detail="Not enough gold")

    # Check stock
    stock = shop_item_data.get("stock", -1)
    if stock != -1 and stock < data.quantity:
        raise HTTPException(status_code=400, detail="Not enough in stock")

    # Add to inventory
    inv = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id,
        PlayerInventory.item_id == item.id
    ).first()

    if inv:
        inv.quantity += data.quantity
    else:
        inv = PlayerInventory(
            user_id=current_user.id,
            item_id=item.id,
            quantity=data.quantity,
        )
        db.add(inv)

    # Deduct gold
    current_user.coins -= total_cost
    db.commit()

    return BuyItemResponse(
        success=True,
        message=f"Purchased {data.quantity}x {item.name}",
        total_cost=total_cost,
        remaining_gold=current_user.coins,
        item_name=item.name,
        quantity_purchased=data.quantity,
    )


@router.post("/{npc_id}/shop/sell", response_model=SellItemResponse)
def sell_item(npc_id: str, data: SellItemRequest, db: DbSession, current_user: CurrentUser):
    """Sell an item to a merchant"""
    npc = db.query(NPC).filter(NPC.npc_id == npc_id).first()
    if not npc or not npc.is_shopkeeper:
        raise HTTPException(status_code=404, detail="Merchant not found")

    item = db.query(Item).filter(Item.item_id == data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    inv = db.query(PlayerInventory).filter(
        PlayerInventory.user_id == current_user.id,
        PlayerInventory.item_id == item.id
    ).first()

    if not inv or inv.quantity < data.quantity:
        raise HTTPException(status_code=400, detail="Not enough items")

    if inv.is_equipped:
        raise HTTPException(status_code=400, detail="Cannot sell equipped items")

    total_earned = item.sell_price * data.quantity

    # Remove from inventory
    inv.quantity -= data.quantity
    if inv.quantity <= 0:
        db.delete(inv)

    # Add gold
    current_user.coins += total_earned
    db.commit()

    return SellItemResponse(
        success=True,
        message=f"Sold {data.quantity}x {item.name}",
        total_earned=total_earned,
        new_gold=current_user.coins,
        item_name=item.name,
        quantity_sold=data.quantity,
    )
