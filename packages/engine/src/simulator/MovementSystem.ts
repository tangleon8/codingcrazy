/**
 * Movement System - handles hero movement in the world
 */

import {
  Position,
  Direction,
  DIRECTION_DELTAS,
  posKey,
  isSamePosition,
} from '../types/common';
import { GameState } from '../types/state';
import { MoveAction, ActionResult } from '../types/actions';
import { ZoneData } from '../types/world';

export class MovementSystem {
  /**
   * Check if a position is walkable in the zone
   */
  isWalkable(zone: ZoneData, pos: Position): boolean {
    // Check bounds
    if (pos.x < 0 || pos.x >= zone.width || pos.y < 0 || pos.y >= zone.height) {
      return false;
    }

    // Check collision map
    return !zone.collisionMap[pos.y][pos.x];
  }

  /**
   * Execute a move action
   */
  execute(state: GameState, action: MoveAction, zone: ZoneData): ActionResult {
    const delta = DIRECTION_DELTAS[action.direction];
    const newPos: Position = {
      x: state.heroPosition.x + delta.x,
      y: state.heroPosition.y + delta.y,
    };

    // Check if position is walkable
    if (!this.isWalkable(zone, newPos)) {
      return {
        success: false,
        message: `Cannot move ${action.direction} - path blocked`,
      };
    }

    // Check for zone transitions
    const transition = zone.transitions.find((t) => isSamePosition(t.position, newPos));
    if (transition) {
      if (transition.isLocked && transition.requiredKeyId) {
        // Check if player has the key
        const hasKey = state.inventory.slots.some(
          (slot) => slot.item.type === 'key' && slot.item.id === transition.requiredKeyId
        );
        if (!hasKey) {
          return {
            success: false,
            message: 'This passage is locked. You need a key.',
          };
        }
      }

      // Zone transition will be handled by the world simulator
      return {
        success: true,
        message: `Moving to ${action.direction}`,
        stateChanges: {
          heroPosition: newPos,
          zoneTransition: {
            targetZoneId: transition.targetZoneId,
            targetPosition: transition.targetPosition,
          },
        },
      };
    }

    // Regular movement
    return {
      success: true,
      message: `Moved ${action.direction}`,
      stateChanges: {
        heroPosition: newPos,
      },
    };
  }

  /**
   * Get all adjacent positions
   */
  getAdjacentPositions(pos: Position): Position[] {
    return [
      { x: pos.x, y: pos.y - 1 }, // up
      { x: pos.x, y: pos.y + 1 }, // down
      { x: pos.x - 1, y: pos.y }, // left
      { x: pos.x + 1, y: pos.y }, // right
    ];
  }

  /**
   * Get the direction from one position to an adjacent position
   */
  getDirection(from: Position, to: Position): Direction | null {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy === -1) return 'up';
    if (dx === 0 && dy === 1) return 'down';
    if (dx === -1 && dy === 0) return 'left';
    if (dx === 1 && dy === 0) return 'right';

    return null;
  }

  /**
   * Simple pathfinding - find path from start to goal
   * Returns array of positions or null if no path found
   */
  findPath(zone: ZoneData, start: Position, goal: Position, maxSteps: number = 100): Position[] | null {
    const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(posKey(start));

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (isSamePosition(current.pos, goal)) {
        return current.path;
      }

      if (current.path.length >= maxSteps) {
        continue;
      }

      for (const neighbor of this.getAdjacentPositions(current.pos)) {
        const key = posKey(neighbor);
        if (!visited.has(key) && this.isWalkable(zone, neighbor)) {
          visited.add(key);
          queue.push({
            pos: neighbor,
            path: [...current.path, neighbor],
          });
        }
      }
    }

    return null; // No path found
  }
}
