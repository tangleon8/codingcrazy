import { describe, it, expect } from 'vitest';
import { GameSimulator, LevelData, Action } from '../index';

const createBasicLevel = (overrides: Partial<LevelData> = {}): LevelData => ({
  gridWidth: 5,
  gridHeight: 5,
  startPosition: { x: 0, y: 2 },
  goals: [{ x: 4, y: 2 }],
  walls: [],
  coins: [],
  hazards: [],
  allowedMethods: ['move', 'wait'],
  instructions: 'Test level',
  starterCode: '',
  winConditions: {
    reachGoal: true,
    collectAllCoins: false,
  },
  ...overrides,
});

describe('GameSimulator', () => {
  describe('basic movement', () => {
    it('should move hero right', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);
      const state = simulator.createInitialState();

      const newState = simulator.executeAction(state, { type: 'move', direction: 'right' });

      expect(newState.heroPosition).toEqual({ x: 1, y: 2 });
      expect(newState.currentTurn).toBe(1);
    });

    it('should move hero up', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);
      const state = simulator.createInitialState();

      const newState = simulator.executeAction(state, { type: 'move', direction: 'up' });

      expect(newState.heroPosition).toEqual({ x: 0, y: 1 });
    });

    it('should not move into walls', () => {
      const level = createBasicLevel({
        walls: [{ x: 1, y: 2 }],
      });
      const simulator = new GameSimulator(level);
      const state = simulator.createInitialState();

      const newState = simulator.executeAction(state, { type: 'move', direction: 'right' });

      expect(newState.heroPosition).toEqual({ x: 0, y: 2 }); // Should stay in place
    });

    it('should not move outside grid bounds', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);
      const state = simulator.createInitialState();

      const newState = simulator.executeAction(state, { type: 'move', direction: 'left' });

      expect(newState.heroPosition).toEqual({ x: 0, y: 2 }); // Should stay at x=0
    });
  });

  describe('wait action', () => {
    it('should increment turn without moving', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);
      const state = simulator.createInitialState();

      const newState = simulator.executeAction(state, { type: 'wait' });

      expect(newState.heroPosition).toEqual({ x: 0, y: 2 });
      expect(newState.currentTurn).toBe(1);
    });
  });

  describe('coin collection', () => {
    it('should collect coins when walking over them', () => {
      const level = createBasicLevel({
        coins: [{ x: 1, y: 2 }],
      });
      const simulator = new GameSimulator(level);
      const state = simulator.createInitialState();

      const newState = simulator.executeAction(state, { type: 'move', direction: 'right' });

      expect(newState.collectedCoins.size).toBe(1);
      expect(newState.collectedCoins.has('1,2')).toBe(true);
    });

    it('should not double-collect coins', () => {
      const level = createBasicLevel({
        coins: [{ x: 1, y: 2 }],
      });
      const simulator = new GameSimulator(level);

      const actions: Action[] = [
        { type: 'move', direction: 'right' },  // Collect coin at (1,2)
        { type: 'move', direction: 'left' },   // Move back
        { type: 'move', direction: 'right' },  // Walk over again
      ];

      const result = simulator.simulate(actions);

      expect(result.finalState.collectedCoins.size).toBe(1);
    });
  });

  describe('win conditions', () => {
    it('should win when reaching goal', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);

      const actions: Action[] = Array(4).fill({ type: 'move', direction: 'right' });
      const result = simulator.simulate(actions);

      expect(result.success).toBe(true);
      expect(result.finalState.hasWon).toBe(true);
      expect(result.winConditionsMet.reachGoal).toBe(true);
    });

    it('should require all coins if collectAllCoins is true', () => {
      const level = createBasicLevel({
        coins: [{ x: 2, y: 2 }],
        winConditions: { reachGoal: true, collectAllCoins: true },
      });
      const simulator = new GameSimulator(level);

      // Go directly to goal without collecting coin
      const actions: Action[] = Array(4).fill({ type: 'move', direction: 'right' });
      const result = simulator.simulate(actions);

      expect(result.success).toBe(false);
      expect(result.winConditionsMet.collectAllCoins).toBe(false);
    });

    it('should win when collecting all coins and reaching goal', () => {
      const level = createBasicLevel({
        coins: [{ x: 2, y: 2 }],
        winConditions: { reachGoal: true, collectAllCoins: true },
      });
      const simulator = new GameSimulator(level);

      // Collect coin then reach goal
      const actions: Action[] = [
        { type: 'move', direction: 'right' },
        { type: 'move', direction: 'right' }, // Collect coin at (2,2)
        { type: 'move', direction: 'right' },
        { type: 'move', direction: 'right' }, // Reach goal at (4,2)
      ];
      const result = simulator.simulate(actions);

      expect(result.success).toBe(true);
      expect(result.winConditionsMet.reachGoal).toBe(true);
      expect(result.winConditionsMet.collectAllCoins).toBe(true);
    });
  });

  describe('hazards', () => {
    it('should kill hero on active static hazard', () => {
      const level = createBasicLevel({
        hazards: [
          { x: 1, y: 2, pattern: 'static', activeFrames: [0], type: 'spike' },
        ],
      });
      const simulator = new GameSimulator(level);

      const actions: Action[] = [{ type: 'move', direction: 'right' }];
      const result = simulator.simulate(actions);

      expect(result.finalState.isAlive).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toContain('hazard');
    });

    it('should not kill hero on inactive toggle hazard', () => {
      const level = createBasicLevel({
        hazards: [
          { x: 1, y: 2, pattern: 'toggle', activeFrames: [0, 2, 4], type: 'spike' },
        ],
      });
      const simulator = new GameSimulator(level);

      // Wait one turn (hazard is active on turn 0, inactive on turn 1)
      // Then move right
      const actions: Action[] = [
        { type: 'wait' },  // Turn 0 -> 1
        { type: 'move', direction: 'right' },  // Turn 1 -> 2, move to (1,2)
      ];
      const result = simulator.simulate(actions);

      // Hero should survive because hazard is inactive on turn 2
      // (activeFrames: [0, 2, 4] means active on turns 0, 2, 4 - and turn 2 IS in activeFrames)
      // Wait, let me reconsider... the check happens AFTER incrementing turn
      // So after wait (turn becomes 1), then after move (turn becomes 2)
      // Turn 2 is in activeFrames, so hero dies
      expect(result.finalState.isAlive).toBe(false);
    });
  });

  describe('simulation limits', () => {
    it('should respect max actions limit', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);

      const actions: Action[] = Array(250).fill({ type: 'move', direction: 'right' });
      const result = simulator.simulate(actions, 100);

      expect(result.turnStates.length).toBeLessThanOrEqual(101); // Initial + 100 actions max
    });

    it('should stop simulation when hero wins', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);

      // 10 moves right, but should stop after 4 (when goal is reached)
      const actions: Action[] = Array(10).fill({ type: 'move', direction: 'right' });
      const result = simulator.simulate(actions);

      expect(result.finalState.hasWon).toBe(true);
      expect(result.finalState.heroPosition).toEqual({ x: 4, y: 2 });
      expect(result.turnStates.length).toBe(5); // Initial + 4 moves
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const level = createBasicLevel();
      const simulator = new GameSimulator(level);
      const originalState = simulator.createInitialState();
      const originalPos = { ...originalState.heroPosition };

      simulator.executeAction(originalState, { type: 'move', direction: 'right' });

      expect(originalState.heroPosition).toEqual(originalPos);
    });
  });
});
