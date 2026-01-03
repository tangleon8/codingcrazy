/**
 * Game Simulator - executes actions and determines win/lose conditions
 */

import {
  Action,
  Direction,
  GameState,
  LevelData,
  Position,
  SimulationResult,
  posKey,
} from './types';

const DIRECTION_DELTAS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class GameSimulator {
  private level: LevelData;
  private wallSet: Set<string>;
  private coinSet: Set<string>;
  private goalSet: Set<string>;

  constructor(level: LevelData) {
    this.level = level;
    this.wallSet = new Set(level.walls.map(posKey));
    this.coinSet = new Set(level.coins.map(posKey));
    this.goalSet = new Set(level.goals.map(posKey));
  }

  /**
   * Create the initial game state
   */
  createInitialState(): GameState {
    return {
      heroPosition: { ...this.level.startPosition },
      collectedCoins: new Set<string>(),
      currentTurn: 0,
      isAlive: true,
      hasWon: false,
      actionHistory: [],
    };
  }

  /**
   * Clone a game state (deep copy)
   */
  cloneState(state: GameState): GameState {
    return {
      heroPosition: { ...state.heroPosition },
      collectedCoins: new Set(state.collectedCoins),
      currentTurn: state.currentTurn,
      isAlive: state.isAlive,
      hasWon: state.hasWon,
      actionHistory: [...state.actionHistory],
    };
  }

  /**
   * Check if a position is valid (within bounds and not a wall)
   */
  isValidPosition(pos: Position): boolean {
    if (
      pos.x < 0 ||
      pos.x >= this.level.gridWidth ||
      pos.y < 0 ||
      pos.y >= this.level.gridHeight
    ) {
      return false;
    }
    return !this.wallSet.has(posKey(pos));
  }

  /**
   * Check if a hazard is active at a given turn
   */
  isHazardActive(hazardIndex: number, turn: number): boolean {
    const hazard = this.level.hazards[hazardIndex];
    if (!hazard) return false;

    if (hazard.pattern === 'static') {
      return true;
    }

    // Toggle pattern - check if turn is in activeFrames
    return hazard.activeFrames.includes(turn % (Math.max(...hazard.activeFrames) + 2));
  }

  /**
   * Check if hero is on an active hazard
   */
  checkHazardCollision(pos: Position, turn: number): boolean {
    for (let i = 0; i < this.level.hazards.length; i++) {
      const hazard = this.level.hazards[i];
      if (hazard.x === pos.x && hazard.y === pos.y && this.isHazardActive(i, turn)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Execute a single action and return the new state
   */
  executeAction(state: GameState, action: Action): GameState {
    const newState = this.cloneState(state);
    newState.actionHistory.push(action);

    if (!newState.isAlive) {
      return newState;
    }

    if (action.type === 'move' && action.direction) {
      const delta = DIRECTION_DELTAS[action.direction];
      const newPos: Position = {
        x: newState.heroPosition.x + delta.x,
        y: newState.heroPosition.y + delta.y,
      };

      // Only move if valid position
      if (this.isValidPosition(newPos)) {
        newState.heroPosition = newPos;
      }
    }
    // 'wait' action does nothing to position

    newState.currentTurn++;

    // Check for coin collection
    const heroKey = posKey(newState.heroPosition);
    if (this.coinSet.has(heroKey) && !newState.collectedCoins.has(heroKey)) {
      newState.collectedCoins.add(heroKey);
    }

    // Check for hazard collision
    if (this.checkHazardCollision(newState.heroPosition, newState.currentTurn)) {
      newState.isAlive = false;
    }

    // Check win conditions
    if (newState.isAlive) {
      newState.hasWon = this.checkWinConditions(newState);
    }

    return newState;
  }

  /**
   * Check if all win conditions are met
   */
  checkWinConditions(state: GameState): boolean {
    const { winConditions } = this.level;
    const heroKey = posKey(state.heroPosition);

    // Check goal reached
    if (winConditions.reachGoal && !this.goalSet.has(heroKey)) {
      return false;
    }

    // Check coins collected
    if (winConditions.collectAllCoins) {
      if (state.collectedCoins.size !== this.level.coins.length) {
        return false;
      }
    }

    return true;
  }

  /**
   * Simulate a full run with a list of actions
   */
  simulate(actions: Action[], maxActions: number = 200): SimulationResult {
    const turnStates: GameState[] = [];
    let state = this.createInitialState();
    turnStates.push(this.cloneState(state));

    // Check initial state for coins
    const heroKey = posKey(state.heroPosition);
    if (this.coinSet.has(heroKey)) {
      state.collectedCoins.add(heroKey);
    }

    for (let i = 0; i < actions.length && i < maxActions; i++) {
      state = this.executeAction(state, actions[i]);
      turnStates.push(this.cloneState(state));

      if (!state.isAlive || state.hasWon) {
        break;
      }
    }

    const heroFinalKey = posKey(state.heroPosition);

    return {
      success: state.hasWon,
      finalState: state,
      turnStates,
      winConditionsMet: {
        reachGoal: this.goalSet.has(heroFinalKey),
        collectAllCoins: state.collectedCoins.size === this.level.coins.length,
      },
      error: !state.isAlive ? 'Hero was destroyed by a hazard!' : undefined,
    };
  }

  /**
   * Get level data
   */
  getLevelData(): LevelData {
    return this.level;
  }
}
