/**
 * Inventory System - handles item management, equipping, and using items
 */

import { GameState } from '../types/state';
import {
  Inventory,
  InventorySlot,
  AnyItem,
  Weapon,
  Armor,
  Consumable,
  EquipSlot,
} from '../types/inventory';
import { EquipAction, UnequipAction, UseItemAction, DropAction, ActionResult } from '../types/actions';
import { StatusEffect } from '../types/combat';

export class InventorySystem {
  /**
   * Add an item to inventory
   */
  addItem(inventory: Inventory, item: AnyItem, quantity: number = 1): { success: boolean; newInventory: Inventory } {
    const newInventory = this.cloneInventory(inventory);

    // Check if item is stackable and already exists
    if (item.stackable) {
      const existingSlotIndex = newInventory.slots.findIndex((s) => s.item.id === item.id);
      if (existingSlotIndex !== -1) {
        const existingSlot = newInventory.slots[existingSlotIndex];
        const newQuantity = Math.min(existingSlot.quantity + quantity, item.maxStack);
        newInventory.slots[existingSlotIndex] = { ...existingSlot, quantity: newQuantity };
        return { success: true, newInventory };
      }
    }

    // Check for available slot
    if (newInventory.slots.length >= newInventory.maxSlots) {
      return { success: false, newInventory: inventory };
    }

    // Add new slot
    newInventory.slots.push({ item, quantity });
    return { success: true, newInventory };
  }

  /**
   * Remove an item from inventory
   */
  removeItem(inventory: Inventory, itemId: string, quantity: number = 1): { success: boolean; newInventory: Inventory } {
    const newInventory = this.cloneInventory(inventory);
    const slotIndex = newInventory.slots.findIndex((s) => s.item.id === itemId);

    if (slotIndex === -1) {
      return { success: false, newInventory: inventory };
    }

    const slot = newInventory.slots[slotIndex];
    if (slot.quantity < quantity) {
      return { success: false, newInventory: inventory };
    }

    if (slot.quantity === quantity) {
      newInventory.slots.splice(slotIndex, 1);
    } else {
      newInventory.slots[slotIndex] = { ...slot, quantity: slot.quantity - quantity };
    }

    return { success: true, newInventory };
  }

  /**
   * Equip a weapon or armor
   */
  equipItem(state: GameState, itemId: string): ActionResult {
    const slotIndex = state.inventory.slots.findIndex((s) => s.item.id === itemId);
    if (slotIndex === -1) {
      return { success: false, message: 'Item not found in inventory.' };
    }

    const slot = state.inventory.slots[slotIndex];
    const item = slot.item;

    if (item.type === 'weapon') {
      const weapon = item as Weapon;
      const newInventory = this.cloneInventory(state.inventory);

      // Unequip current weapon if any
      if (newInventory.equipped.weapon) {
        const { success, newInventory: inv } = this.addItem(newInventory, newInventory.equipped.weapon);
        if (!success) {
          return { success: false, message: 'Inventory full. Cannot unequip current weapon.' };
        }
        Object.assign(newInventory, inv);
      }

      // Remove from inventory and equip
      newInventory.slots.splice(slotIndex, 1);
      newInventory.equipped.weapon = weapon;

      return {
        success: true,
        message: `Equipped ${weapon.name}. Attack +${weapon.attackBonus}`,
        stateChanges: { inventory: newInventory },
      };
    }

    if (item.type === 'armor') {
      const armor = item as Armor;
      const slot = armor.slot as keyof Inventory['equipped'];

      if (slot === 'weapon') {
        return { success: false, message: 'Invalid armor slot.' };
      }

      const newInventory = this.cloneInventory(state.inventory);

      // Unequip current armor in slot if any
      const currentArmor = newInventory.equipped[slot];
      if (currentArmor) {
        const { success, newInventory: inv } = this.addItem(newInventory, currentArmor);
        if (!success) {
          return { success: false, message: 'Inventory full. Cannot unequip current armor.' };
        }
        Object.assign(newInventory, inv);
      }

      // Remove from inventory and equip
      const itemSlotIndex = newInventory.slots.findIndex((s) => s.item.id === itemId);
      if (itemSlotIndex !== -1) {
        newInventory.slots.splice(itemSlotIndex, 1);
      }
      newInventory.equipped[slot] = armor;

      return {
        success: true,
        message: `Equipped ${armor.name}. Defense +${armor.defenseBonus}`,
        stateChanges: { inventory: newInventory },
      };
    }

    return { success: false, message: 'This item cannot be equipped.' };
  }

  /**
   * Unequip an item
   */
  unequipItem(state: GameState, slot: string): ActionResult {
    const equipSlot = slot as keyof Inventory['equipped'];
    const newInventory = this.cloneInventory(state.inventory);

    const equipped = newInventory.equipped[equipSlot];
    if (!equipped) {
      return { success: false, message: 'Nothing equipped in that slot.' };
    }

    // Add to inventory
    const { success, newInventory: inv } = this.addItem(newInventory, equipped);
    if (!success) {
      return { success: false, message: 'Inventory full. Cannot unequip.' };
    }

    // Clear slot
    if (equipSlot === 'weapon') {
      inv.equipped.weapon = null;
    } else {
      inv.equipped[equipSlot as Exclude<keyof Inventory['equipped'], 'weapon'>] = null;
    }

    return {
      success: true,
      message: `Unequipped ${equipped.name}.`,
      stateChanges: { inventory: inv },
    };
  }

  /**
   * Use a consumable item (outside of combat)
   */
  useItem(state: GameState, itemId: string): ActionResult {
    const slotIndex = state.inventory.slots.findIndex((s) => s.item.id === itemId);
    if (slotIndex === -1) {
      return { success: false, message: 'Item not found in inventory.' };
    }

    const slot = state.inventory.slots[slotIndex];
    if (slot.item.type !== 'consumable') {
      return { success: false, message: 'This item cannot be used.' };
    }

    const consumable = slot.item as Consumable;
    const newInventory = this.cloneInventory(state.inventory);
    let message = '';
    let hpChange = 0;
    let mpChange = 0;
    const effectsApplied: StatusEffect[] = [];

    switch (consumable.effect.type) {
      case 'heal':
        hpChange = Math.min(
          consumable.effect.value,
          state.hero.stats.maxHp - state.hero.stats.currentHp
        );
        message = `You use ${consumable.name} and restore ${hpChange} HP.`;
        break;
      case 'mana':
        mpChange = Math.min(
          consumable.effect.value,
          state.hero.stats.maxMp - state.hero.stats.currentMp
        );
        message = `You use ${consumable.name} and restore ${mpChange} MP.`;
        break;
      case 'buff_attack':
        effectsApplied.push({
          type: 'buff_attack',
          duration: consumable.effect.duration || 5,
          value: consumable.effect.value,
          source: consumable.id,
        });
        message = `You use ${consumable.name}. Attack increased!`;
        break;
      case 'buff_defense':
        effectsApplied.push({
          type: 'buff_defense',
          duration: consumable.effect.duration || 5,
          value: consumable.effect.value,
          source: consumable.id,
        });
        message = `You use ${consumable.name}. Defense increased!`;
        break;
      case 'cure':
        message = `You use ${consumable.name}. Status effects cured!`;
        break;
      default:
        return { success: false, message: 'Cannot use this item here.' };
    }

    // Remove one item
    if (slot.quantity <= 1) {
      newInventory.slots.splice(slotIndex, 1);
    } else {
      newInventory.slots[slotIndex] = { ...slot, quantity: slot.quantity - 1 };
    }

    return {
      success: true,
      message,
      stateChanges: {
        inventory: newInventory,
        heroHpChange: hpChange,
        heroMpChange: mpChange,
        statusEffects: effectsApplied,
        cureEffects: consumable.effect.type === 'cure',
      },
    };
  }

  /**
   * Drop an item from inventory
   */
  dropItem(state: GameState, itemId: string, quantity: number): ActionResult {
    const { success, newInventory } = this.removeItem(state.inventory, itemId, quantity);
    if (!success) {
      return { success: false, message: 'Cannot drop item.' };
    }

    const item = state.inventory.slots.find((s) => s.item.id === itemId)?.item;
    return {
      success: true,
      message: `Dropped ${quantity}x ${item?.name || 'item'}.`,
      stateChanges: {
        inventory: newInventory,
        itemDropped: { itemId, quantity, position: state.heroPosition },
      },
    };
  }

  /**
   * Add gold to inventory
   */
  addGold(inventory: Inventory, amount: number): Inventory {
    return {
      ...inventory,
      gold: inventory.gold + amount,
    };
  }

  /**
   * Remove gold from inventory
   */
  removeGold(inventory: Inventory, amount: number): { success: boolean; newInventory: Inventory } {
    if (inventory.gold < amount) {
      return { success: false, newInventory: inventory };
    }
    return {
      success: true,
      newInventory: {
        ...inventory,
        gold: inventory.gold - amount,
      },
    };
  }

  /**
   * Check if inventory has an item
   */
  hasItem(inventory: Inventory, itemId: string, quantity: number = 1): boolean {
    const slot = inventory.slots.find((s) => s.item.id === itemId);
    return slot !== undefined && slot.quantity >= quantity;
  }

  /**
   * Get total attack including equipped weapon
   */
  getTotalAttack(state: GameState): number {
    let attack = state.hero.stats.attack;
    if (state.inventory.equipped.weapon) {
      attack += state.inventory.equipped.weapon.attackBonus;
    }
    // Add buff effects
    for (const effect of state.hero.statusEffects) {
      if (effect.type === 'buff_attack') {
        attack += effect.value;
      } else if (effect.type === 'debuff_attack') {
        attack -= effect.value;
      }
    }
    return Math.max(1, attack);
  }

  /**
   * Get total defense including equipped armor
   */
  getTotalDefense(state: GameState): number {
    let defense = state.hero.stats.defense;
    const armorSlots = ['head', 'chest', 'legs', 'feet', 'accessory'] as const;
    for (const slot of armorSlots) {
      const armor = state.inventory.equipped[slot];
      if (armor) {
        defense += armor.defenseBonus;
      }
    }
    // Add buff effects
    for (const effect of state.hero.statusEffects) {
      if (effect.type === 'buff_defense') {
        defense += effect.value;
      } else if (effect.type === 'debuff_defense') {
        defense -= effect.value;
      }
    }
    return Math.max(0, defense);
  }

  /**
   * Clone inventory (deep copy)
   */
  private cloneInventory(inventory: Inventory): Inventory {
    return {
      slots: inventory.slots.map((s) => ({ item: { ...s.item } as AnyItem, quantity: s.quantity })),
      maxSlots: inventory.maxSlots,
      gold: inventory.gold,
      equipped: {
        weapon: inventory.equipped.weapon ? { ...inventory.equipped.weapon } : null,
        head: inventory.equipped.head ? { ...inventory.equipped.head } : null,
        chest: inventory.equipped.chest ? { ...inventory.equipped.chest } : null,
        legs: inventory.equipped.legs ? { ...inventory.equipped.legs } : null,
        feet: inventory.equipped.feet ? { ...inventory.equipped.feet } : null,
        accessory: inventory.equipped.accessory ? { ...inventory.equipped.accessory } : null,
      },
    };
  }
}
