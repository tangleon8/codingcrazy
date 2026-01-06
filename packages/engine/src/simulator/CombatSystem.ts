/**
 * Combat System - handles turn-based combat mechanics
 */

import { GameState } from '../types/state';
import { Enemy } from '../types/entities';
import {
  CombatState,
  CombatOutcome,
  DamageResult,
  CombatFormulas,
  StatusEffect,
} from '../types/combat';
import {
  AttackAction,
  DefendAction,
  FleeAction,
  UseItemAction,
  ActionResult,
} from '../types/actions';
import { Consumable } from '../types/inventory';

export class CombatSystem {
  /**
   * Initiate combat with an enemy
   */
  initiateCombat(state: GameState, enemy: Enemy): CombatState {
    // Determine turn order based on speed
    const heroSpeed = state.hero.stats.speed;
    const enemySpeed = enemy.speed;

    const turnOrder = heroSpeed >= enemySpeed ? ['hero', enemy.id] : [enemy.id, 'hero'];

    return {
      inCombat: true,
      enemyId: enemy.id,
      enemyCurrentHp: enemy.currentHp,
      enemyMaxHp: enemy.maxHp,
      turnOrder,
      currentTurnIndex: 0,
      combatLog: [],
      heroIsDefending: false,
      turnCount: 0,
    };
  }

  /**
   * Process a hero attack action
   */
  processAttack(state: GameState, enemy: Enemy): ActionResult {
    if (!state.combatState) {
      return { success: false, message: 'Not in combat' };
    }

    // Calculate damage
    const heroStats = {
      ...state.hero.stats,
      attack: state.hero.stats.attack + this.getEquippedAttackBonus(state),
    };

    const enemyStats = {
      maxHp: enemy.maxHp,
      attack: enemy.attack,
      defense: enemy.defense,
      speed: enemy.speed,
      critChance: 0.05,
      critMultiplier: 1.5,
    };

    const damage = CombatFormulas.calculateDamage(heroStats, enemyStats, false);

    // Apply damage to enemy
    const newEnemyHp = Math.max(0, state.combatState.enemyCurrentHp - damage.actualDamage);

    // Create combat outcome
    const outcome: CombatOutcome = {
      success: true,
      attacker: 'hero',
      defender: enemy.id,
      action: 'attack',
      damage,
      message: damage.isCritical
        ? `Critical hit! You deal ${damage.actualDamage} damage to ${enemy.name}!`
        : `You attack ${enemy.name} for ${damage.actualDamage} damage.`,
    };

    // Check if enemy is defeated
    const enemyDefeated = newEnemyHp <= 0;
    if (enemyDefeated) {
      outcome.message += ` ${enemy.name} is defeated!`;
    }

    return {
      success: true,
      message: outcome.message,
      stateChanges: {
        combatState: {
          ...state.combatState,
          enemyCurrentHp: newEnemyHp,
          combatLog: [...state.combatState.combatLog, outcome],
          heroIsDefending: false,
        },
        enemyDefeated,
        xpReward: enemyDefeated ? enemy.xpReward : 0,
        coinReward: enemyDefeated ? enemy.coinReward : 0,
        lootTable: enemyDefeated ? enemy.lootTable : [],
      },
    };
  }

  /**
   * Process a defend action
   */
  processDefend(state: GameState): ActionResult {
    if (!state.combatState) {
      return { success: false, message: 'Not in combat' };
    }

    const outcome: CombatOutcome = {
      success: true,
      attacker: 'hero',
      defender: 'hero',
      action: 'defend',
      message: 'You take a defensive stance, reducing incoming damage.',
    };

    return {
      success: true,
      message: outcome.message,
      stateChanges: {
        combatState: {
          ...state.combatState,
          heroIsDefending: true,
          combatLog: [...state.combatState.combatLog, outcome],
        },
      },
    };
  }

  /**
   * Process a flee action
   */
  processFlee(state: GameState, enemy: Enemy): ActionResult {
    if (!state.combatState) {
      return { success: false, message: 'Not in combat' };
    }

    const fleeChance = CombatFormulas.fleeChance(state.hero.stats.speed, enemy.speed);
    const fleeSuccess = Math.random() < fleeChance;

    const outcome: CombatOutcome = {
      success: fleeSuccess,
      attacker: 'hero',
      defender: enemy.id,
      action: 'flee',
      message: fleeSuccess
        ? 'You successfully escaped!'
        : `You failed to escape from ${enemy.name}!`,
    };

    return {
      success: true,
      message: outcome.message,
      stateChanges: {
        combatState: fleeSuccess
          ? null
          : {
              ...state.combatState,
              combatLog: [...state.combatState.combatLog, outcome],
              heroIsDefending: false,
            },
        fleeSuccess,
      },
    };
  }

  /**
   * Process enemy turn
   */
  processEnemyTurn(state: GameState, enemy: Enemy): ActionResult {
    if (!state.combatState) {
      return { success: false, message: 'Not in combat' };
    }

    // Enemy always attacks (simple AI)
    const enemyStats = {
      maxHp: enemy.maxHp,
      attack: enemy.attack,
      defense: enemy.defense,
      speed: enemy.speed,
      critChance: 0.05,
      critMultiplier: 1.5,
    };

    const heroStats = {
      ...state.hero.stats,
      defense: state.hero.stats.defense + this.getEquippedDefenseBonus(state),
    };

    const damage = CombatFormulas.calculateDamage(
      enemyStats,
      heroStats,
      state.combatState.heroIsDefending
    );

    // Apply damage to hero
    const newHeroHp = Math.max(0, state.hero.stats.currentHp - damage.actualDamage);

    const outcome: CombatOutcome = {
      success: true,
      attacker: enemy.id,
      defender: 'hero',
      action: 'attack',
      damage,
      message: state.combatState.heroIsDefending
        ? `${enemy.name} attacks! You block ${damage.damageBlocked} damage and take ${damage.actualDamage} damage.`
        : `${enemy.name} attacks you for ${damage.actualDamage} damage!`,
    };

    const heroDefeated = newHeroHp <= 0;
    if (heroDefeated) {
      outcome.message += ' You have been defeated!';
    }

    return {
      success: true,
      message: outcome.message,
      stateChanges: {
        heroHp: newHeroHp,
        combatState: {
          ...state.combatState,
          combatLog: [...state.combatState.combatLog, outcome],
          heroIsDefending: false,
          turnCount: state.combatState.turnCount + 1,
        },
        heroDefeated,
      },
    };
  }

  /**
   * Process using an item in combat
   */
  processUseItem(state: GameState, itemId: string): ActionResult {
    // Find the item in inventory
    const slotIndex = state.inventory.slots.findIndex((slot) => slot.item.id === itemId);
    if (slotIndex === -1) {
      return { success: false, message: 'Item not found in inventory' };
    }

    const slot = state.inventory.slots[slotIndex];
    if (slot.item.type !== 'consumable') {
      return { success: false, message: 'This item cannot be used in combat' };
    }

    const consumable = slot.item as Consumable;
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
          duration: consumable.effect.duration || 3,
          value: consumable.effect.value,
          source: consumable.id,
        });
        message = `You use ${consumable.name}. Attack increased by ${consumable.effect.value} for ${consumable.effect.duration} turns.`;
        break;
      case 'buff_defense':
        effectsApplied.push({
          type: 'buff_defense',
          duration: consumable.effect.duration || 3,
          value: consumable.effect.value,
          source: consumable.id,
        });
        message = `You use ${consumable.name}. Defense increased by ${consumable.effect.value} for ${consumable.effect.duration} turns.`;
        break;
      default:
        return { success: false, message: 'Cannot use this item in combat' };
    }

    // Remove one item from inventory
    const newSlots = [...state.inventory.slots];
    if (slot.quantity <= 1) {
      newSlots.splice(slotIndex, 1);
    } else {
      newSlots[slotIndex] = { ...slot, quantity: slot.quantity - 1 };
    }

    return {
      success: true,
      message,
      stateChanges: {
        heroHp: state.hero.stats.currentHp + hpChange,
        heroMp: state.hero.stats.currentMp + mpChange,
        statusEffects: effectsApplied,
        inventorySlots: newSlots,
        combatState: state.combatState
          ? {
              ...state.combatState,
              heroIsDefending: false,
            }
          : null,
      },
    };
  }

  /**
   * Process status effects at end of turn
   */
  processStatusEffects(state: GameState): { hpChange: number; effects: StatusEffect[] } {
    let hpChange = 0;
    const remainingEffects: StatusEffect[] = [];

    for (const effect of state.hero.statusEffects) {
      switch (effect.type) {
        case 'poison':
        case 'burn':
          hpChange -= effect.value;
          break;
        case 'regen':
          hpChange += effect.value;
          break;
      }

      // Decrement duration
      if (effect.duration > 1) {
        remainingEffects.push({ ...effect, duration: effect.duration - 1 });
      }
    }

    return { hpChange, effects: remainingEffects };
  }

  /**
   * Award XP and check for level up
   */
  awardXP(state: GameState, xp: number): { newStats: typeof state.hero.stats; leveledUp: boolean } {
    const newStats = { ...state.hero.stats };
    newStats.currentXp += xp;

    let leveledUp = false;

    // Check for level up
    while (newStats.currentXp >= newStats.xpToNextLevel) {
      newStats.currentXp -= newStats.xpToNextLevel;
      newStats.level++;
      newStats.xpToNextLevel = CombatFormulas.xpForLevel(newStats.level);

      // Apply stat increases
      const levelStats = CombatFormulas.heroStatsForLevel(newStats.level);
      newStats.maxHp = levelStats.maxHp;
      newStats.currentHp = newStats.maxHp; // Full heal on level up
      newStats.attack = levelStats.attack;
      newStats.defense = levelStats.defense;
      newStats.speed = levelStats.speed;
      newStats.critChance = levelStats.critChance;

      leveledUp = true;
    }

    return { newStats, leveledUp };
  }

  /**
   * Get attack bonus from equipped weapon
   */
  private getEquippedAttackBonus(state: GameState): number {
    return state.inventory.equipped.weapon?.attackBonus || 0;
  }

  /**
   * Get defense bonus from equipped armor
   */
  private getEquippedDefenseBonus(state: GameState): number {
    let bonus = 0;
    const slots = ['head', 'chest', 'legs', 'feet', 'accessory'] as const;
    for (const slot of slots) {
      const armor = state.inventory.equipped[slot];
      if (armor) {
        bonus += armor.defenseBonus;
      }
    }
    return bonus;
  }
}
