/**
 * Game state types
 */

import { Position } from './common';
import { Action } from './actions';
import { HeroStats, CombatState, StatusEffect } from './combat';
import { Inventory, createEmptyInventory } from './inventory';
import { WorldState, createEmptyWorldState } from './world';
import { DialogueNode } from './entities';

// Hero's current state
export interface HeroState {
  stats: HeroStats;
  statusEffects: StatusEffect[];
  isDefending: boolean;
  lastRestTurn: number;
}

// Active dialogue state
export interface DialogueState {
  npcId: string;
  currentNode: DialogueNode;
  history: string[]; // Previous node IDs
}

// Complete game state for the RPG world
export interface GameState {
  // Position and basic state
  heroPosition: Position;
  currentTurn: number;
  isAlive: boolean;
  hasWon: boolean;

  // Action history
  actionHistory: Action[];

  // RPG components
  hero: HeroState;
  inventory: Inventory;
  worldState: WorldState;

  // Active states
  combatState: CombatState | null;
  dialogueState: DialogueState | null;

  // Quest and story flags
  flags: Record<string, boolean | number | string>;

  // Console output from code execution
  consoleOutput: string[];
}

// Legacy game state for backward compatibility with existing levels
export interface LegacyGameState {
  heroPosition: Position;
  collectedCoins: Set<string>;
  currentTurn: number;
  isAlive: boolean;
  hasWon: boolean;
  actionHistory: Action[];
}

// Result of simulating a sequence of actions
export interface SimulationResult {
  success: boolean;
  finalState: GameState;
  turnStates: GameState[];
  error?: string;
  combatResults?: CombatState[];
  itemsCollected?: string[];
  xpGained?: number;
  goldGained?: number;
}

// Legacy simulation result for backward compatibility
export interface LegacySimulationResult {
  success: boolean;
  finalState: LegacyGameState;
  turnStates: LegacyGameState[];
  error?: string;
  winConditionsMet: {
    reachGoal: boolean;
    collectAllCoins: boolean;
  };
}

// Result of code execution in the sandbox
export interface ExecutionResult {
  actions: Action[];
  error?: string;
  consoleOutput: string[];
}

// Create initial hero state for a new game
export function createInitialHeroState(level: number = 1): HeroState {
  const baseHp = 100 + (level - 1) * 10;
  const baseMp = 50 + (level - 1) * 5;

  return {
    stats: {
      level,
      currentHp: baseHp,
      maxHp: baseHp,
      currentMp: baseMp,
      maxMp: baseMp,
      currentXp: 0,
      xpToNextLevel: Math.floor(100 * Math.pow(1.5, level - 1)),
      attack: 10 + (level - 1) * 2,
      defense: 5 + (level - 1) * 1,
      speed: 5 + Math.floor((level - 1) / 2),
      critChance: 0.05 + (level - 1) * 0.005,
      critMultiplier: 1.5,
    },
    statusEffects: [],
    isDefending: false,
    lastRestTurn: 0,
  };
}

// Create initial game state for a new game
export function createInitialGameState(
  startPosition: Position,
  startZoneId: string,
  heroLevel: number = 1
): GameState {
  return {
    heroPosition: startPosition,
    currentTurn: 0,
    isAlive: true,
    hasWon: false,
    actionHistory: [],
    hero: createInitialHeroState(heroLevel),
    inventory: createEmptyInventory(),
    worldState: createEmptyWorldState(startZoneId),
    combatState: null,
    dialogueState: null,
    flags: {},
    consoleOutput: [],
  };
}

// Deep clone a game state (for immutable updates)
export function cloneGameState(state: GameState): GameState {
  return {
    heroPosition: { ...state.heroPosition },
    currentTurn: state.currentTurn,
    isAlive: state.isAlive,
    hasWon: state.hasWon,
    actionHistory: [...state.actionHistory],
    hero: {
      stats: { ...state.hero.stats },
      statusEffects: state.hero.statusEffects.map((e) => ({ ...e })),
      isDefending: state.hero.isDefending,
      lastRestTurn: state.hero.lastRestTurn,
    },
    inventory: {
      slots: state.inventory.slots.map((s) => ({ item: { ...s.item } as any, quantity: s.quantity })),
      maxSlots: state.inventory.maxSlots,
      gold: state.inventory.gold,
      equipped: {
        weapon: state.inventory.equipped.weapon ? { ...state.inventory.equipped.weapon } : null,
        head: state.inventory.equipped.head ? { ...state.inventory.equipped.head } : null,
        chest: state.inventory.equipped.chest ? { ...state.inventory.equipped.chest } : null,
        legs: state.inventory.equipped.legs ? { ...state.inventory.equipped.legs } : null,
        feet: state.inventory.equipped.feet ? { ...state.inventory.equipped.feet } : null,
        accessory: state.inventory.equipped.accessory ? { ...state.inventory.equipped.accessory } : null,
      },
    },
    worldState: {
      currentZoneId: state.worldState.currentZoneId,
      currentRegion: state.worldState.currentRegion,
      enemies: new Map(state.worldState.enemies),
      npcs: new Map(state.worldState.npcs),
      chests: new Map(state.worldState.chests),
      itemDrops: new Map(state.worldState.itemDrops),
      openedChests: new Set(state.worldState.openedChests),
      killedEnemies: new Map(state.worldState.killedEnemies),
      discoveredZones: new Set(state.worldState.discoveredZones),
      discoveredSpawnPoints: new Set(state.worldState.discoveredSpawnPoints),
      npcDialogueStates: new Map(state.worldState.npcDialogueStates),
    },
    combatState: state.combatState
      ? {
          ...state.combatState,
          turnOrder: [...state.combatState.turnOrder],
          combatLog: state.combatState.combatLog.map((c) => ({ ...c })),
        }
      : null,
    dialogueState: state.dialogueState
      ? {
          ...state.dialogueState,
          currentNode: { ...state.dialogueState.currentNode },
          history: [...state.dialogueState.history],
        }
      : null,
    flags: { ...state.flags },
    consoleOutput: [...state.consoleOutput],
  };
}
