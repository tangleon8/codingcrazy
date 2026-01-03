/**
 * Core types for the game engine
 */

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type ActionType = 'move' | 'wait';

export interface Action {
  type: ActionType;
  direction?: Direction;
}

export interface LevelData {
  gridWidth: number;
  gridHeight: number;
  startPosition: Position;
  goals: Position[];
  walls: Position[];
  coins: Position[];
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

export interface GameState {
  heroPosition: Position;
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

// Utility to create position key for Set/Map
export function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

// Parse position key back to Position
export function parseKey(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}
