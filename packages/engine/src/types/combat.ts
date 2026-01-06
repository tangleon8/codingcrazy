/**
 * Combat system types
 */

// Base combat stats shared by heroes and enemies
export interface CombatStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  critChance: number; // 0-1 percentage
  critMultiplier: number; // e.g., 1.5 for 150% damage
}

// Hero-specific stats extending base combat stats
export interface HeroStats extends CombatStats {
  level: number;
  currentHp: number;
  currentXp: number;
  xpToNextLevel: number;
  // Mana for future spell system
  maxMp: number;
  currentMp: number;
}

// Status effects that can be applied to heroes or enemies
export type StatusEffectType =
  | 'poison'
  | 'burn'
  | 'freeze'
  | 'stun'
  | 'buff_attack'
  | 'buff_defense'
  | 'debuff_attack'
  | 'debuff_defense'
  | 'regen';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // remaining turns
  value: number; // damage per turn, buff amount, etc.
  source: string; // what caused this effect
}

// Combat action types
export type CombatActionType = 'attack' | 'defend' | 'useItem' | 'flee';

// Result of a damage calculation
export interface DamageResult {
  rawDamage: number;
  actualDamage: number;
  isCritical: boolean;
  isBlocked: boolean;
  damageBlocked: number;
}

// Outcome of a combat action
export interface CombatOutcome {
  success: boolean;
  attacker: string;
  defender: string;
  action: CombatActionType;
  damage?: DamageResult;
  effectsApplied?: StatusEffect[];
  message: string;
}

// Current state of an active combat encounter
export interface CombatState {
  inCombat: boolean;
  enemyId: string;
  enemyCurrentHp: number;
  enemyMaxHp: number;
  turnOrder: string[]; // 'hero' or enemy IDs
  currentTurnIndex: number;
  combatLog: CombatOutcome[];
  heroIsDefending: boolean;
  turnCount: number;
}

// Combat formulas and calculations
export const CombatFormulas = {
  // Calculate XP needed for a level
  xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  },

  // Calculate base stats for a hero at a given level
  heroStatsForLevel(level: number): CombatStats {
    return {
      maxHp: 100 + (level - 1) * 10,
      attack: 10 + (level - 1) * 2,
      defense: 5 + (level - 1) * 1,
      speed: 5 + Math.floor((level - 1) / 2),
      critChance: 0.05 + (level - 1) * 0.005,
      critMultiplier: 1.5,
    };
  },

  // Scale enemy stats to a target level
  scaleEnemyStats(baseStats: CombatStats, targetLevel: number): CombatStats {
    return {
      maxHp: Math.floor(baseStats.maxHp * (1 + (targetLevel - 1) * 0.15)),
      attack: Math.floor(baseStats.attack * (1 + (targetLevel - 1) * 0.1)),
      defense: Math.floor(baseStats.defense * (1 + (targetLevel - 1) * 0.08)),
      speed: baseStats.speed,
      critChance: baseStats.critChance,
      critMultiplier: baseStats.critMultiplier,
    };
  },

  // Calculate damage from an attack
  calculateDamage(
    attacker: CombatStats,
    defender: CombatStats,
    isDefending: boolean
  ): DamageResult {
    // Base damage = attack - (defense / 2)
    const baseDamage = Math.max(1, attacker.attack - Math.floor(defender.defense / 2));

    // Critical hit check
    const isCritical = Math.random() < attacker.critChance;
    const critMultiplier = isCritical ? attacker.critMultiplier : 1;

    // Raw damage after crit
    const rawDamage = Math.floor(baseDamage * critMultiplier);

    // Defense reduction when defending (50% damage reduction)
    const defenseMultiplier = isDefending ? 0.5 : 1;
    const damageBlocked = isDefending ? Math.floor(rawDamage * 0.5) : 0;
    const actualDamage = Math.max(1, Math.floor(rawDamage * defenseMultiplier));

    return {
      rawDamage,
      actualDamage,
      isCritical,
      isBlocked: isDefending,
      damageBlocked,
    };
  },

  // Calculate flee chance based on speeds
  fleeChance(heroSpeed: number, enemySpeed: number): number {
    const baseChance = 0.5;
    const speedDiff = heroSpeed - enemySpeed;
    return Math.min(0.95, Math.max(0.1, baseChance + speedDiff * 0.05));
  },
};
