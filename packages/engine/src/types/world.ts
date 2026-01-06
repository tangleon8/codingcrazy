/**
 * World and zone types
 */

import { Position } from './common';
import { Enemy, NPC, Chest, ItemDrop } from './entities';

// Tile types for the world map
export type TileType =
  | 'grass'
  | 'water'
  | 'stone'
  | 'sand'
  | 'dirt'
  | 'wall'
  | 'floor'
  | 'path'
  | 'void';

// Region themes
export type RegionTheme = 'forest' | 'cave' | 'desert' | 'snow' | 'town' | 'dungeon' | 'swamp';

// A region within a zone (for area-specific effects)
export interface Region {
  id: string;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  levelRange: {
    min: number;
    max: number;
  };
  theme: RegionTheme;
  ambientMusic?: string;
}

// Spawn point for player respawning
export interface SpawnPoint {
  id: string;
  position: Position;
  isDefault: boolean;
  name: string;
}

// Zone transition (portal/door to another zone)
export interface ZoneTransition {
  id: string;
  position: Position;
  targetZoneId: string;
  targetPosition: Position;
  requiredKeyId?: string;
  isLocked: boolean;
}

// Hazard in the world (spikes, fire, etc.)
export interface Hazard {
  id: string;
  position: Position;
  type: 'spike' | 'fire' | 'poison' | 'ice';
  pattern: 'static' | 'toggle';
  activeFrames: number[]; // For toggle pattern
  damage: number;
}

// Complete zone data structure
export interface ZoneData {
  id: string;
  slug: string;
  name: string;
  description: string;
  width: number;
  height: number;

  // Terrain data
  terrain: TileType[][];
  collisionMap: boolean[][]; // true = blocked

  // Regions within the zone
  regions: Region[];

  // Spawn points
  spawnPoints: SpawnPoint[];
  defaultSpawnId: string;

  // Zone transitions
  transitions: ZoneTransition[];

  // Hazards
  hazards: Hazard[];

  // Static decorations (for rendering, no gameplay effect)
  decorations: Decoration[];
}

// Decoration for visual purposes
export interface Decoration {
  id: string;
  position: Position;
  spriteKey: string;
  layer: number; // Render order
}

// Enemy spawn configuration for a zone
export interface EnemySpawnConfig {
  id: string;
  enemyType: string;
  position: Position;
  levelMin: number;
  levelMax: number;
  respawnTime: number; // Turns until respawn
  isBoss: boolean;
}

// NPC placement in a zone
export interface NPCPlacement {
  npcId: string;
  position: Position;
}

// Chest placement in a zone
export interface ChestPlacement {
  chestId: string;
  position: Position;
}

// Complete world data (all zones combined)
export interface WorldData {
  id: string;
  name: string;
  zones: ZoneData[];
  startZoneId: string;

  // Entity definitions (shared across zones)
  enemySpawns: Record<string, EnemySpawnConfig[]>;
  npcPlacements: Record<string, NPCPlacement[]>;
  chestPlacements: Record<string, ChestPlacement[]>;
}

// Runtime state of the world for a player
export interface WorldState {
  currentZoneId: string;
  currentRegion: string | null;

  // Entity instances in the current zone
  enemies: Map<string, Enemy>;
  npcs: Map<string, NPC>;
  chests: Map<string, Chest>;
  itemDrops: Map<string, ItemDrop>;

  // Player-specific progress
  openedChests: Set<string>;
  killedEnemies: Map<string, number>; // enemyId -> respawn turn
  discoveredZones: Set<string>;
  discoveredSpawnPoints: Set<string>;

  // NPC interaction states
  npcDialogueStates: Map<string, string>; // npcId -> current dialogue node
}

// Create an empty world state
export function createEmptyWorldState(startZoneId: string): WorldState {
  return {
    currentZoneId: startZoneId,
    currentRegion: null,
    enemies: new Map(),
    npcs: new Map(),
    chests: new Map(),
    itemDrops: new Map(),
    openedChests: new Set(),
    killedEnemies: new Map(),
    discoveredZones: new Set([startZoneId]),
    discoveredSpawnPoints: new Set(),
    npcDialogueStates: new Map(),
  };
}
