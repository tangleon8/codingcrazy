/**
 * Inventory and item types
 */

// Item categories
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'key' | 'quest' | 'material';

// Item rarity levels
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Equipment slots
export type EquipSlot = 'weapon' | 'head' | 'chest' | 'legs' | 'feet' | 'accessory';

// Weapon types
export type WeaponType = 'sword' | 'axe' | 'bow' | 'staff' | 'dagger';

// Base item interface
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  value: number; // Gold value for buying/selling
  spriteKey: string;
}

// Weapon item
export interface Weapon extends Item {
  type: 'weapon';
  weaponType: WeaponType;
  attackBonus: number;
  critBonus: number;
  range: number; // 1 = melee, 2+ = ranged
}

// Armor item
export interface Armor extends Item {
  type: 'armor';
  slot: EquipSlot;
  defenseBonus: number;
  hpBonus: number;
}

// Consumable effect types
export type ConsumableEffectType = 'heal' | 'mana' | 'buff_attack' | 'buff_defense' | 'cure' | 'damage';

export interface ConsumableEffect {
  type: ConsumableEffectType;
  value: number;
  duration?: number; // For buffs, in turns
}

// Consumable item (potions, food, etc.)
export interface Consumable extends Item {
  type: 'consumable';
  effect: ConsumableEffect;
}

// Key item
export interface KeyItem extends Item {
  type: 'key';
  unlocksChestId?: string;
  unlocksDoorId?: string;
}

// Quest item
export interface QuestItem extends Item {
  type: 'quest';
  questId: string;
}

// Material item (crafting ingredients, etc.)
export interface MaterialItem extends Item {
  type: 'material';
}

// Union type for all item variants
export type AnyItem = Weapon | Armor | Consumable | KeyItem | QuestItem | MaterialItem;

// Inventory slot containing an item and quantity
export interface InventorySlot {
  item: AnyItem;
  quantity: number;
}

// Player's full inventory state
export interface Inventory {
  slots: InventorySlot[];
  maxSlots: number;
  gold: number;
  equipped: {
    weapon: Weapon | null;
    head: Armor | null;
    chest: Armor | null;
    legs: Armor | null;
    feet: Armor | null;
    accessory: Armor | null;
  };
}

// Helper to create an empty inventory
export function createEmptyInventory(maxSlots: number = 20): Inventory {
  return {
    slots: [],
    maxSlots,
    gold: 0,
    equipped: {
      weapon: null,
      head: null,
      chest: null,
      legs: null,
      feet: null,
      accessory: null,
    },
  };
}

// Calculate total attack bonus from equipped items
export function getEquippedAttackBonus(inventory: Inventory): number {
  let bonus = 0;
  if (inventory.equipped.weapon) {
    bonus += inventory.equipped.weapon.attackBonus;
  }
  return bonus;
}

// Calculate total defense bonus from equipped items
export function getEquippedDefenseBonus(inventory: Inventory): number {
  let bonus = 0;
  const armorSlots: (keyof Inventory['equipped'])[] = ['head', 'chest', 'legs', 'feet', 'accessory'];
  for (const slot of armorSlots) {
    const armor = inventory.equipped[slot] as Armor | null;
    if (armor) {
      bonus += armor.defenseBonus;
    }
  }
  return bonus;
}

// Calculate total HP bonus from equipped items
export function getEquippedHpBonus(inventory: Inventory): number {
  let bonus = 0;
  const armorSlots: (keyof Inventory['equipped'])[] = ['head', 'chest', 'legs', 'feet', 'accessory'];
  for (const slot of armorSlots) {
    const armor = inventory.equipped[slot] as Armor | null;
    if (armor) {
      bonus += armor.hpBonus;
    }
  }
  return bonus;
}
