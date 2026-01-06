/**
 * Interaction System - handles NPC dialogue, chests, and shop interactions
 */

import { GameState, DialogueState } from '../types/state';
import { NPC, Chest, DialogueNode, ShopItem, LootDrop } from '../types/entities';
import { AnyItem, InventorySlot } from '../types/inventory';
import {
  TalkAction,
  OpenChestAction,
  BuyAction,
  SellAction,
  SelectDialogOptionAction,
  ActionResult,
} from '../types/actions';
import { Position, isAdjacent, isSamePosition } from '../types/common';

export class InteractionSystem {
  /**
   * Start talking to an NPC
   */
  startDialogue(state: GameState, npc: NPC): ActionResult {
    // Check if adjacent to NPC
    if (!isAdjacent(state.heroPosition, npc.position)) {
      return { success: false, message: `${npc.displayName} is too far away to talk to.` };
    }

    const startNode = npc.dialogue.nodes[npc.dialogue.startNode];
    if (!startNode) {
      return { success: false, message: `${npc.displayName} has nothing to say.` };
    }

    const dialogueState: DialogueState = {
      npcId: npc.id,
      currentNode: startNode,
      history: [npc.dialogue.startNode],
    };

    return {
      success: true,
      message: `${npc.displayName}: "${startNode.text}"`,
      stateChanges: {
        dialogueState,
      },
    };
  }

  /**
   * Select a dialogue option
   */
  selectDialogueOption(
    state: GameState,
    npc: NPC,
    optionIndex: number
  ): ActionResult {
    if (!state.dialogueState) {
      return { success: false, message: 'Not in a conversation' };
    }

    const currentNode = state.dialogueState.currentNode;
    if (optionIndex < 0 || optionIndex >= currentNode.options.length) {
      return { success: false, message: 'Invalid dialogue option' };
    }

    const option = currentNode.options[optionIndex];

    // Handle dialogue actions
    let actionMessage = '';
    const stateChanges: Record<string, unknown> = {};

    if (option.action) {
      switch (option.action.type) {
        case 'open_shop':
          stateChanges.shopOpen = true;
          stateChanges.shopNpcId = npc.id;
          actionMessage = ' [Shop opened]';
          break;
        case 'give_item':
          // Would need item registry to implement fully
          actionMessage = ' [Received item]';
          break;
        case 'heal':
          stateChanges.heroHp = state.hero.stats.maxHp;
          actionMessage = ' [HP fully restored]';
          break;
      }
    }

    // End conversation or continue
    if (option.nextNode === null) {
      return {
        success: true,
        message: `You: "${option.text}"${actionMessage}. [Conversation ended]`,
        stateChanges: {
          ...stateChanges,
          dialogueState: null,
        },
      };
    }

    const nextNode = npc.dialogue.nodes[option.nextNode];
    if (!nextNode) {
      return {
        success: true,
        message: `You: "${option.text}"${actionMessage}. [Conversation ended]`,
        stateChanges: {
          ...stateChanges,
          dialogueState: null,
        },
      };
    }

    return {
      success: true,
      message: `You: "${option.text}"${actionMessage}\n${npc.displayName}: "${nextNode.text}"`,
      stateChanges: {
        ...stateChanges,
        dialogueState: {
          npcId: npc.id,
          currentNode: nextNode,
          history: [...state.dialogueState.history, option.nextNode],
        },
      },
    };
  }

  /**
   * Open a chest
   */
  openChest(state: GameState, chest: Chest, itemRegistry: Map<string, AnyItem>): ActionResult {
    // Check if on or adjacent to chest
    if (!isSamePosition(state.heroPosition, chest.position) &&
        !isAdjacent(state.heroPosition, chest.position)) {
      return { success: false, message: 'The chest is too far away.' };
    }

    // Check if already opened (for one-time chests)
    if (chest.isOpen) {
      return { success: false, message: 'This chest is already open.' };
    }

    // Check if locked
    if (chest.isLocked && chest.requiredKeyId) {
      const hasKey = state.inventory.slots.some(
        (slot) => slot.item.type === 'key' && slot.item.id === chest.requiredKeyId
      );
      if (!hasKey) {
        return { success: false, message: 'This chest is locked. You need a key.' };
      }
    }

    // Process loot
    const receivedItems: { item: AnyItem; quantity: number }[] = [];
    let goldReceived = chest.coinAmount;

    for (const drop of chest.contents) {
      if (Math.random() <= drop.chance) {
        const item = itemRegistry.get(drop.itemId);
        if (item) {
          const quantity = Math.floor(
            Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
          );
          receivedItems.push({ item, quantity });
        }
      }
    }

    // Build message
    let message = 'You open the chest and find: ';
    const lootMessages: string[] = [];
    if (goldReceived > 0) {
      lootMessages.push(`${goldReceived} gold`);
    }
    for (const { item, quantity } of receivedItems) {
      lootMessages.push(quantity > 1 ? `${quantity}x ${item.name}` : item.name);
    }
    message += lootMessages.length > 0 ? lootMessages.join(', ') : 'nothing';

    return {
      success: true,
      message,
      stateChanges: {
        chestOpened: chest.id,
        goldReceived,
        itemsReceived: receivedItems,
      },
    };
  }

  /**
   * Buy an item from a shop
   */
  buyItem(
    state: GameState,
    npc: NPC,
    itemId: string,
    quantity: number,
    itemRegistry: Map<string, AnyItem>
  ): ActionResult {
    if (!npc.isShopkeeper || !npc.shopInventory) {
      return { success: false, message: `${npc.displayName} is not a merchant.` };
    }

    // Find the item in shop
    const shopItem = npc.shopInventory.find((i) => i.itemId === itemId);
    if (!shopItem) {
      return { success: false, message: 'This item is not for sale here.' };
    }

    // Check stock
    if (shopItem.stock !== -1 && shopItem.stock < quantity) {
      return { success: false, message: `Only ${shopItem.stock} available.` };
    }

    // Check gold
    const totalCost = shopItem.price * quantity;
    if (state.inventory.gold < totalCost) {
      return { success: false, message: `Not enough gold. You need ${totalCost} gold.` };
    }

    // Check inventory space
    const item = itemRegistry.get(itemId);
    if (!item) {
      return { success: false, message: 'Item not found.' };
    }

    const existingSlot = state.inventory.slots.find((s) => s.item.id === itemId);
    if (!existingSlot && state.inventory.slots.length >= state.inventory.maxSlots) {
      return { success: false, message: 'Inventory is full.' };
    }

    return {
      success: true,
      message: `Bought ${quantity}x ${item.name} for ${totalCost} gold.`,
      stateChanges: {
        goldChange: -totalCost,
        itemReceived: { item, quantity },
        shopStockChange: shopItem.stock !== -1 ? { itemId, change: -quantity } : null,
      },
    };
  }

  /**
   * Sell an item to a shop
   */
  sellItem(
    state: GameState,
    npc: NPC,
    itemId: string,
    quantity: number
  ): ActionResult {
    if (!npc.isShopkeeper) {
      return { success: false, message: `${npc.displayName} is not a merchant.` };
    }

    // Find item in inventory
    const slotIndex = state.inventory.slots.findIndex((s) => s.item.id === itemId);
    if (slotIndex === -1) {
      return { success: false, message: 'You do not have this item.' };
    }

    const slot = state.inventory.slots[slotIndex];
    if (slot.quantity < quantity) {
      return { success: false, message: `You only have ${slot.quantity}.` };
    }

    // Calculate sell price (typically 50% of buy price)
    const sellPrice = Math.floor(slot.item.value * 0.5) * quantity;

    return {
      success: true,
      message: `Sold ${quantity}x ${slot.item.name} for ${sellPrice} gold.`,
      stateChanges: {
        goldChange: sellPrice,
        itemRemoved: { itemId, quantity },
      },
    };
  }

  /**
   * Pick up an item drop from the ground
   */
  pickUpItem(state: GameState, itemId: string, itemRegistry: Map<string, AnyItem>): ActionResult {
    const item = itemRegistry.get(itemId);
    if (!item) {
      return { success: false, message: 'Item not found.' };
    }

    // Check inventory space
    const existingSlot = state.inventory.slots.find((s) => s.item.id === itemId);
    if (!existingSlot && state.inventory.slots.length >= state.inventory.maxSlots) {
      return { success: false, message: 'Inventory is full.' };
    }

    return {
      success: true,
      message: `Picked up ${item.name}.`,
      stateChanges: {
        itemReceived: { item, quantity: 1 },
        itemDropRemoved: itemId,
      },
    };
  }
}
