/**
 * CodingCrazy Game Engine
 *
 * Pure TypeScript game/simulation logic for the learn-to-code platform.
 * This package contains no rendering code - it only handles:
 * - Action parsing and validation
 * - Game state simulation
 * - Win condition checking
 * - Combat mechanics
 * - Inventory management
 * - World state management
 */

// Export all types from the new types module
export * from './types/index';

// Legacy simulator for puzzle levels (backward compatibility)
export { GameSimulator } from './simulator';

// New modular simulator for RPG world
export {
  WorldSimulator,
  MovementSystem,
  CombatSystem,
  InteractionSystem,
  InventorySystem,
} from './simulator/index';

// Re-export commonly used types at top level for convenience
export type {
  Position,
  Direction,
  Action,
  ActionType,
  GameState,
  SimulationResult,
  ExecutionResult,
} from './types/index';
