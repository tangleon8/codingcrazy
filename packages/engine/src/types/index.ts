/**
 * Engine types - re-exports all type modules
 */

// Common types and utilities
export * from './common';

// Entity types (enemies, NPCs, chests, etc.)
export * from './entities';

// Combat system types
export * from './combat';

// Inventory and item types
export * from './inventory';

// World and zone types
export * from './world';

// Action types
export * from './actions';

// Game state types
export * from './state';

// Legacy types for backward compatibility with existing levels
export interface LevelData {
  gridWidth: number;
  gridHeight: number;
  startPosition: import('./common').Position;
  goals: import('./common').Position[];
  walls: import('./common').Position[];
  coins: import('./common').Position[];
  hazards: LegacyHazard[];
  allowedMethods: string[];
  instructions: string;
  starterCode: string;
  winConditions: WinConditions;
}

export interface LegacyHazard {
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
