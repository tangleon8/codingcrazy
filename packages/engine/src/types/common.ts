/**
 * Common types and utilities used across the engine
 */

export interface Position {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_DELTAS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Utility to create position key for Set/Map
export function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

// Parse position key back to Position
export function parseKey(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

// Calculate Manhattan distance between two positions
export function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Check if two positions are the same
export function isSamePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

// Check if two positions are adjacent (Manhattan distance of 1)
export function isAdjacent(a: Position, b: Position): boolean {
  return distance(a, b) === 1;
}
