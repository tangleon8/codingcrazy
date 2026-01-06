'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  api,
  WorldStateResponse,
  CombatStartResponse,
  CombatActionResponse,
  InventoryResponse,
  EnemyStats,
} from '@/lib/api';

interface CombatState {
  isInCombat: boolean;
  enemy: EnemyStats | null;
  enemyHp: number;
  playerHp: number;
  playerMaxHp: number;
  lastPlayerAction: string;
  lastEnemyAction: string;
}

interface WorldContextType {
  worldState: WorldStateResponse | null;
  inventory: InventoryResponse | null;
  combatState: CombatState;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWorldState: () => Promise<void>;
  loadInventory: () => Promise<void>;
  movePlayer: (x: number, y: number) => Promise<boolean>;
  startCombat: (enemySpawnId: number) => Promise<boolean>;
  performCombatAction: (action: string, itemId?: string) => Promise<CombatActionResponse | null>;
  useItem: (itemId: string) => Promise<boolean>;
  equipItem: (itemId: string) => Promise<boolean>;
  openChest: (chestId: string) => Promise<boolean>;
  respawn: () => Promise<void>;
}

const WorldContext = createContext<WorldContextType | null>(null);

export function WorldProvider({ children }: { children: ReactNode }) {
  const [worldState, setWorldState] = useState<WorldStateResponse | null>(null);
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [combatState, setCombatState] = useState<CombatState>({
    isInCombat: false,
    enemy: null,
    enemyHp: 0,
    playerHp: 0,
    playerMaxHp: 0,
    lastPlayerAction: '',
    lastEnemyAction: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorldState = useCallback(async () => {
    try {
      setIsLoading(true);
      const state = await api.getWorldState();
      setWorldState(state);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load world state');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const inv = await api.getInventory();
      setInventory(inv);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }, []);

  const movePlayer = useCallback(async (x: number, y: number): Promise<boolean> => {
    try {
      await api.movePlayer(x, y);
      await loadWorldState();
      return true;
    } catch (err) {
      console.error('Move failed:', err);
      return false;
    }
  }, [loadWorldState]);

  const startCombat = useCallback(async (enemySpawnId: number): Promise<boolean> => {
    try {
      const result: CombatStartResponse = await api.startCombat(enemySpawnId);
      setCombatState({
        isInCombat: true,
        enemy: result.enemy,
        enemyHp: result.enemy.hp,
        playerHp: result.player_hp,
        playerMaxHp: result.player_max_hp,
        lastPlayerAction: '',
        lastEnemyAction: result.message,
      });
      return true;
    } catch (err) {
      console.error('Failed to start combat:', err);
      return false;
    }
  }, []);

  const performCombatAction = useCallback(async (
    action: string,
    itemId?: string
  ): Promise<CombatActionResponse | null> => {
    try {
      const result = await api.combatAction(action, itemId);

      setCombatState(prev => ({
        ...prev,
        enemyHp: result.enemy_hp,
        playerHp: result.player_hp,
        lastPlayerAction: result.player_action_result,
        lastEnemyAction: result.enemy_action_result,
        isInCombat: !result.combat_ended,
        enemy: result.combat_ended ? null : prev.enemy,
      }));

      if (result.combat_ended) {
        await loadWorldState();
        await loadInventory();
      }

      return result;
    } catch (err) {
      console.error('Combat action failed:', err);
      return null;
    }
  }, [loadWorldState, loadInventory]);

  const useItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      await api.useItem(itemId);
      await loadInventory();
      await loadWorldState();
      return true;
    } catch (err) {
      console.error('Failed to use item:', err);
      return false;
    }
  }, [loadInventory, loadWorldState]);

  const equipItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      await api.equipItem(itemId);
      await loadInventory();
      await loadWorldState();
      return true;
    } catch (err) {
      console.error('Failed to equip item:', err);
      return false;
    }
  }, [loadInventory, loadWorldState]);

  const openChest = useCallback(async (chestId: string): Promise<boolean> => {
    try {
      await api.openChest(chestId);
      await loadWorldState();
      await loadInventory();
      return true;
    } catch (err) {
      console.error('Failed to open chest:', err);
      return false;
    }
  }, [loadWorldState, loadInventory]);

  const respawn = useCallback(async () => {
    try {
      await api.respawnPlayer();
      await loadWorldState();
    } catch (err) {
      console.error('Failed to respawn:', err);
    }
  }, [loadWorldState]);

  return (
    <WorldContext.Provider
      value={{
        worldState,
        inventory,
        combatState,
        isLoading,
        error,
        loadWorldState,
        loadInventory,
        movePlayer,
        startCombat,
        performCombatAction,
        useItem,
        equipItem,
        openChest,
        respawn,
      }}
    >
      {children}
    </WorldContext.Provider>
  );
}

export function useWorld() {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
}
