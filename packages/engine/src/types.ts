/**
 * Legacy types for backward compatibility
 *
 * This file maintains the original type definitions for existing level-based gameplay.
 * New RPG features should use the types from './types/index.ts'
 */

// Re-export common utilities from new types
export { Position, Direction, posKey, parseKey } from './types/common';

// Legacy action types (only move and wait for puzzle levels)
export type ActionType = 'move' | 'wait';

export interface Action {
  type: ActionType;
  direction?: Direction;
}

// Import Direction type for the interface
import type { Direction } from './types/common';

// Legacy level data structure (for puzzle levels)
export interface LevelData {
  gridWidth: number;
  gridHeight: number;
  startPosition: import('./types/common').Position;
  goals: import('./types/common').Position[];
  walls: import('./types/common').Position[];
  coins: import('./types/common').Position[];
  hazards: Hazard[];
  allowedMethods: string[];
  instructions: string;
  starterCode: string;
  winConditions: WinConditions;
}

export interface Hazard {
  x: number;
  y: number;
  pattern: 'toggle' | 'static';
  activeFrames: number[];
  type: 'spike' | 'fire';
}

export interface WinConditions {
  reachGoal: boolean;
  collectAllCoins: boolean;
}

// Legacy game state (for puzzle levels)
export interface GameState {
  heroPosition: import('./types/common').Position;
  collectedCoins: Set<string>;
  currentTurn: number;
  isAlive: boolean;
  hasWon: boolean;
  actionHistory: Action[];
}

export interface SimulationResult {
  success: boolean;
  finalState: GameState;
  turnStates: GameState[];
  error?: string;
  winConditionsMet: {
    reachGoal: boolean;
    collectAllCoins: boolean;
  };
}

export interface ExecutionResult {
  actions: Action[];
  error?: string;
  consoleOutput: string[];
}
