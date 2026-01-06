/**
 * Entity types for the game world
 */

import { Position } from './common';

// Base entity type that all game objects extend
export type EntityType = 'enemy' | 'npc' | 'chest' | 'item_drop' | 'interactable';

export interface Entity {
  id: string;
  type: EntityType;
  position: Position;
  isActive: boolean;
}

// Enemy behavior patterns
export type EnemyBehaviorPattern = 'stationary' | 'patrol' | 'chase' | 'flee';

export interface EnemyBehavior {
  pattern: EnemyBehaviorPattern;
  patrolPath?: Position[];
  fleeThreshold?: number; // HP percentage to start fleeing
}

// Enemy type identifiers
export type EnemyTypeId = 'boar' | 'wolf' | 'skeleton' | 'goblin' | 'bee' | 'snail' | 'slime' | string;

export interface Enemy extends Entity {
  type: 'enemy';
  name: string;
  enemyType: EnemyTypeId;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  coinReward: number;
  lootTable: LootDrop[];
  behavior: EnemyBehavior;
  aggroRange: number;
  isAggro: boolean;
  respawnTime: number; // turns until respawn, 0 = no respawn
  spriteKey: string;
}

export interface LootDrop {
  itemId: string;
  chance: number; // 0-1
  minQuantity: number;
  maxQuantity: number;
}

// NPC types
export type NPCType = 'merchant' | 'quest_giver' | 'trainer' | 'villager';

export interface NPC extends Entity {
  type: 'npc';
  name: string;
  displayName: string;
  npcType: NPCType;
  dialogue: DialogueTree;
  isShopkeeper: boolean;
  shopInventory?: ShopItem[];
  spriteKey: string;
}

export interface ShopItem {
  itemId: string;
  price: number;
  stock: number; // -1 for unlimited
}

export interface DialogueTree {
  startNode: string;
  nodes: Record<string, DialogueNode>;
}

export interface DialogueNode {
  text: string;
  options: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  nextNode: string | null; // null ends conversation
  action?: DialogueAction;
}

export interface DialogueAction {
  type: 'open_shop' | 'give_item' | 'give_quest' | 'heal';
  data?: Record<string, unknown>;
}

// Chest types
export type ChestType = 'wooden' | 'iron' | 'golden' | 'legendary';

export interface Chest extends Entity {
  type: 'chest';
  chestType: ChestType;
  isOpen: boolean;
  isLocked: boolean;
  requiredKeyId?: string;
  contents: LootDrop[];
  coinAmount: number;
  isOneTime: boolean; // If true, can only be opened once per player
}

// Item drops in the world (dropped by enemies or from chests)
export interface ItemDrop extends Entity {
  type: 'item_drop';
  itemId: string;
  quantity: number;
  despawnTurn?: number; // Turn when this item disappears
}
