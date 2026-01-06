/**
 * Action types for the game engine
 */

import { Direction } from './common';

// All possible action types in the game
export type ActionType =
  // Movement actions (existing)
  | 'move'
  | 'wait'
  // Combat actions
  | 'attack'
  | 'defend'
  | 'flee'
  // Inventory actions
  | 'useItem'
  | 'equip'
  | 'unequip'
  | 'pickUp'
  | 'drop'
  // Interaction actions
  | 'talk'
  | 'openChest'
  | 'buy'
  | 'sell'
  // Dialog actions
  | 'selectDialogOption';

// Base action interface
export interface BaseAction {
  type: ActionType;
}

// Movement action
export interface MoveAction extends BaseAction {
  type: 'move';
  direction: Direction;
}

// Wait action (skip turn)
export interface WaitAction extends BaseAction {
  type: 'wait';
}

// Attack action
export interface AttackAction extends BaseAction {
  type: 'attack';
  targetId?: string; // If not specified, attacks current combat target
}

// Defend action (reduce incoming damage)
export interface DefendAction extends BaseAction {
  type: 'defend';
}

// Flee action (attempt to escape combat)
export interface FleeAction extends BaseAction {
  type: 'flee';
}

// Use item action
export interface UseItemAction extends BaseAction {
  type: 'useItem';
  itemId: string;
  targetId?: string; // For items that can be used on others
}

// Equip item action
export interface EquipAction extends BaseAction {
  type: 'equip';
  itemId: string;
}

// Unequip item action
export interface UnequipAction extends BaseAction {
  type: 'unequip';
  slot: string;
}

// Pick up item action
export interface PickUpAction extends BaseAction {
  type: 'pickUp';
  itemDropId?: string; // If not specified, picks up nearest item
}

// Drop item action
export interface DropAction extends BaseAction {
  type: 'drop';
  itemId: string;
  quantity: number;
}

// Talk to NPC action
export interface TalkAction extends BaseAction {
  type: 'talk';
  npcId?: string; // If not specified, talks to nearest NPC
}

// Open chest action
export interface OpenChestAction extends BaseAction {
  type: 'openChest';
  chestId?: string; // If not specified, opens adjacent chest
}

// Buy item from shop action
export interface BuyAction extends BaseAction {
  type: 'buy';
  itemId: string;
  quantity: number;
}

// Sell item to shop action
export interface SellAction extends BaseAction {
  type: 'sell';
  itemId: string;
  quantity: number;
}

// Select dialog option action
export interface SelectDialogOptionAction extends BaseAction {
  type: 'selectDialogOption';
  optionIndex: number;
}

// Union type for all actions
export type Action =
  | MoveAction
  | WaitAction
  | AttackAction
  | DefendAction
  | FleeAction
  | UseItemAction
  | EquipAction
  | UnequipAction
  | PickUpAction
  | DropAction
  | TalkAction
  | OpenChestAction
  | BuyAction
  | SellAction
  | SelectDialogOptionAction;

// Action validation result
export interface ActionValidation {
  valid: boolean;
  reason?: string;
}

// Result of executing an action
export interface ActionResult {
  success: boolean;
  message: string;
  stateChanges?: Record<string, unknown>;
}

// Helper to create actions
export const Actions = {
  move(direction: Direction): MoveAction {
    return { type: 'move', direction };
  },
  wait(): WaitAction {
    return { type: 'wait' };
  },
  attack(targetId?: string): AttackAction {
    return { type: 'attack', targetId };
  },
  defend(): DefendAction {
    return { type: 'defend' };
  },
  flee(): FleeAction {
    return { type: 'flee' };
  },
  useItem(itemId: string, targetId?: string): UseItemAction {
    return { type: 'useItem', itemId, targetId };
  },
  equip(itemId: string): EquipAction {
    return { type: 'equip', itemId };
  },
  unequip(slot: string): UnequipAction {
    return { type: 'unequip', slot };
  },
  pickUp(itemDropId?: string): PickUpAction {
    return { type: 'pickUp', itemDropId };
  },
  drop(itemId: string, quantity: number): DropAction {
    return { type: 'drop', itemId, quantity };
  },
  talk(npcId?: string): TalkAction {
    return { type: 'talk', npcId };
  },
  openChest(chestId?: string): OpenChestAction {
    return { type: 'openChest', chestId };
  },
  buy(itemId: string, quantity: number): BuyAction {
    return { type: 'buy', itemId, quantity };
  },
  sell(itemId: string, quantity: number): SellAction {
    return { type: 'sell', itemId, quantity };
  },
  selectDialogOption(optionIndex: number): SelectDialogOptionAction {
    return { type: 'selectDialogOption', optionIndex };
  },
};
