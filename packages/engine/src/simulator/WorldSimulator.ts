/**
 * World Simulator - Main orchestrator for the RPG world
 *
 * Coordinates all subsystems (movement, combat, interaction, inventory)
 * and manages the overall game state.
 */

import {
  GameState,
  SimulationResult,
  createInitialGameState,
  cloneGameState,
} from '../types/state';
import { Position, posKey, isAdjacent, isSamePosition, distance } from '../types/common';
import { Action, ActionResult } from '../types/actions';
import { ZoneData, WorldData } from '../types/world';
import { Enemy, NPC, Chest, ItemDrop, LootDrop } from '../types/entities';
import { AnyItem } from '../types/inventory';

import { MovementSystem } from './MovementSystem';
import { CombatSystem } from './CombatSystem';
import { InteractionSystem } from './InteractionSystem';
import { InventorySystem } from './InventorySystem';

export class WorldSimulator {
  private worldData: WorldData;
  private currentZone: ZoneData;
  private itemRegistry: Map<string, AnyItem>;

  // Subsystems
  private movementSystem: MovementSystem;
  private combatSystem: CombatSystem;
  private interactionSystem: InteractionSystem;
  private inventorySystem: InventorySystem;

  constructor(worldData: WorldData, itemRegistry: Map<string, AnyItem>) {
    this.worldData = worldData;
    this.itemRegistry = itemRegistry;

    // Find starting zone
    const startZone = worldData.zones.find((z) => z.id === worldData.startZoneId);
    if (!startZone) {
      throw new Error(`Start zone ${worldData.startZoneId} not found`);
    }
    this.currentZone = startZone;

    // Initialize subsystems
    this.movementSystem = new MovementSystem();
    this.combatSystem = new CombatSystem();
    this.interactionSystem = new InteractionSystem();
    this.inventorySystem = new InventorySystem();
  }

  /**
   * Create initial game state for a new game
   */
  createInitialState(heroLevel: number = 1): GameState {
    const spawn = this.currentZone.spawnPoints.find((s) => s.id === this.currentZone.defaultSpawnId);
    const startPosition = spawn?.position || { x: 0, y: 0 };

    const state = createInitialGameState(startPosition, this.currentZone.id, heroLevel);

    // Spawn initial enemies, NPCs, and chests
    this.spawnEntities(state);

    return state;
  }

  /**
   * Spawn entities in the current zone
   */
  private spawnEntities(state: GameState): void {
    // Spawn enemies
    const enemySpawns = this.worldData.enemySpawns[this.currentZone.id] || [];
    for (const spawn of enemySpawns) {
      // Check if enemy was killed and is still on respawn cooldown
      const respawnTurn = state.worldState.killedEnemies.get(spawn.id);
      if (respawnTurn !== undefined && state.currentTurn < respawnTurn) {
        continue;
      }

      const enemy: Enemy = {
        id: spawn.id,
        type: 'enemy',
        name: spawn.enemyType,
        enemyType: spawn.enemyType,
        position: { ...spawn.position },
        isActive: true,
        maxHp: 50, // Base HP, would be loaded from enemy definitions
        currentHp: 50,
        attack: 10,
        defense: 5,
        speed: 5,
        xpReward: 25,
        coinReward: 10,
        lootTable: [],
        behavior: { pattern: 'stationary' },
        aggroRange: 3,
        isAggro: false,
        respawnTime: spawn.respawnTime,
        spriteKey: spawn.enemyType,
      };
      state.worldState.enemies.set(spawn.id, enemy);
    }

    // Spawn NPCs
    const npcPlacements = this.worldData.npcPlacements[this.currentZone.id] || [];
    for (const placement of npcPlacements) {
      // NPCs would be loaded from a registry similar to items
      const npc: NPC = {
        id: placement.npcId,
        type: 'npc',
        name: placement.npcId,
        displayName: placement.npcId,
        npcType: 'villager',
        position: { ...placement.position },
        isActive: true,
        dialogue: {
          startNode: 'start',
          nodes: {
            start: {
              text: 'Hello, traveler!',
              options: [{ text: 'Goodbye', nextNode: null }],
            },
          },
        },
        isShopkeeper: false,
        spriteKey: 'npc',
      };
      state.worldState.npcs.set(placement.npcId, npc);
    }

    // Spawn chests (only if not already opened)
    const chestPlacements = this.worldData.chestPlacements[this.currentZone.id] || [];
    for (const placement of chestPlacements) {
      if (state.worldState.openedChests.has(placement.chestId)) {
        continue;
      }

      const chest: Chest = {
        id: placement.chestId,
        type: 'chest',
        chestType: 'wooden',
        position: { ...placement.position },
        isActive: true,
        isOpen: false,
        isLocked: false,
        contents: [],
        coinAmount: 10,
        isOneTime: true,
      };
      state.worldState.chests.set(placement.chestId, chest);
    }
  }

  /**
   * Execute a single action
   */
  executeAction(state: GameState, action: Action): GameState {
    const newState = cloneGameState(state);
    newState.actionHistory.push(action);

    // Don't process actions if dead
    if (!newState.isAlive) {
      return newState;
    }

    let result: ActionResult;

    switch (action.type) {
      case 'move':
        result = this.movementSystem.execute(newState, action, this.currentZone);
        break;

      case 'wait':
        result = { success: true, message: 'You wait...' };
        break;

      case 'attack':
        result = this.handleAttack(newState, action.targetId);
        break;

      case 'defend':
        result = this.combatSystem.processDefend(newState);
        break;

      case 'flee':
        result = this.handleFlee(newState);
        break;

      case 'useItem':
        if (newState.combatState) {
          result = this.combatSystem.processUseItem(newState, action.itemId!);
        } else {
          result = this.inventorySystem.useItem(newState, action.itemId!);
        }
        break;

      case 'equip':
        result = this.inventorySystem.equipItem(newState, action.itemId!);
        break;

      case 'unequip':
        result = this.inventorySystem.unequipItem(newState, action.slot!);
        break;

      case 'talk':
        result = this.handleTalk(newState, action.npcId);
        break;

      case 'openChest':
        result = this.handleOpenChest(newState, action.chestId);
        break;

      case 'buy':
        result = this.handleBuy(newState, action.itemId!, action.quantity!);
        break;

      case 'sell':
        result = this.handleSell(newState, action.itemId!, action.quantity!);
        break;

      case 'pickUp':
        result = this.handlePickUp(newState, action.itemDropId);
        break;

      case 'selectDialogOption':
        result = this.handleDialogOption(newState, action.optionIndex!);
        break;

      default:
        result = { success: false, message: 'Unknown action' };
    }

    // Apply state changes from result
    if (result.success && result.stateChanges) {
      this.applyStateChanges(newState, result.stateChanges);
    }

    // Add message to console output
    newState.consoleOutput.push(result.message);

    return newState;
  }

  /**
   * Handle attack action
   */
  private handleAttack(state: GameState, targetId?: string): ActionResult {
    // If in combat, attack current enemy
    if (state.combatState) {
      const enemy = state.worldState.enemies.get(state.combatState.enemyId);
      if (!enemy) {
        return { success: false, message: 'No enemy to attack' };
      }
      return this.combatSystem.processAttack(state, enemy);
    }

    // Find nearby enemy to attack
    let target: Enemy | undefined;
    if (targetId) {
      target = state.worldState.enemies.get(targetId);
    } else {
      // Find closest enemy
      let closestDist = Infinity;
      for (const [id, enemy] of state.worldState.enemies) {
        const dist = distance(state.heroPosition, enemy.position);
        if (dist <= 1 && dist < closestDist) {
          closestDist = dist;
          target = enemy;
        }
      }
    }

    if (!target) {
      return { success: false, message: 'No enemy nearby to attack' };
    }

    // Initiate combat
    state.combatState = this.combatSystem.initiateCombat(state, target);
    return this.combatSystem.processAttack(state, target);
  }

  /**
   * Handle flee action
   */
  private handleFlee(state: GameState): ActionResult {
    if (!state.combatState) {
      return { success: false, message: 'Not in combat' };
    }

    const enemy = state.worldState.enemies.get(state.combatState.enemyId);
    if (!enemy) {
      return { success: false, message: 'No enemy to flee from' };
    }

    return this.combatSystem.processFlee(state, enemy);
  }

  /**
   * Handle talk action
   */
  private handleTalk(state: GameState, npcId?: string): ActionResult {
    let target: NPC | undefined;

    if (npcId) {
      target = state.worldState.npcs.get(npcId);
    } else {
      // Find adjacent NPC
      for (const [id, npc] of state.worldState.npcs) {
        if (isAdjacent(state.heroPosition, npc.position)) {
          target = npc;
          break;
        }
      }
    }

    if (!target) {
      return { success: false, message: 'No one nearby to talk to' };
    }

    return this.interactionSystem.startDialogue(state, target);
  }

  /**
   * Handle open chest action
   */
  private handleOpenChest(state: GameState, chestId?: string): ActionResult {
    let target: Chest | undefined;

    if (chestId) {
      target = state.worldState.chests.get(chestId);
    } else {
      // Find adjacent or same-position chest
      for (const [id, chest] of state.worldState.chests) {
        if (
          isSamePosition(state.heroPosition, chest.position) ||
          isAdjacent(state.heroPosition, chest.position)
        ) {
          target = chest;
          break;
        }
      }
    }

    if (!target) {
      return { success: false, message: 'No chest nearby' };
    }

    return this.interactionSystem.openChest(state, target, this.itemRegistry);
  }

  /**
   * Handle buy action
   */
  private handleBuy(state: GameState, itemId: string, quantity: number): ActionResult {
    // Find shopkeeper NPC we're talking to
    if (!state.dialogueState) {
      return { success: false, message: 'Not talking to a merchant' };
    }

    const npc = state.worldState.npcs.get(state.dialogueState.npcId);
    if (!npc) {
      return { success: false, message: 'Merchant not found' };
    }

    return this.interactionSystem.buyItem(state, npc, itemId, quantity, this.itemRegistry);
  }

  /**
   * Handle sell action
   */
  private handleSell(state: GameState, itemId: string, quantity: number): ActionResult {
    if (!state.dialogueState) {
      return { success: false, message: 'Not talking to a merchant' };
    }

    const npc = state.worldState.npcs.get(state.dialogueState.npcId);
    if (!npc) {
      return { success: false, message: 'Merchant not found' };
    }

    return this.interactionSystem.sellItem(state, npc, itemId, quantity);
  }

  /**
   * Handle pick up item action
   */
  private handlePickUp(state: GameState, itemDropId?: string): ActionResult {
    let target: ItemDrop | undefined;

    if (itemDropId) {
      target = state.worldState.itemDrops.get(itemDropId);
    } else {
      // Find item at current position
      for (const [id, drop] of state.worldState.itemDrops) {
        if (isSamePosition(state.heroPosition, drop.position)) {
          target = drop;
          break;
        }
      }
    }

    if (!target) {
      return { success: false, message: 'No item to pick up' };
    }

    return this.interactionSystem.pickUpItem(state, target.itemId, this.itemRegistry);
  }

  /**
   * Handle dialog option selection
   */
  private handleDialogOption(state: GameState, optionIndex: number): ActionResult {
    if (!state.dialogueState) {
      return { success: false, message: 'Not in a conversation' };
    }

    const npc = state.worldState.npcs.get(state.dialogueState.npcId);
    if (!npc) {
      return { success: false, message: 'NPC not found' };
    }

    return this.interactionSystem.selectDialogueOption(state, npc, optionIndex);
  }

  /**
   * Apply state changes from an action result
   */
  private applyStateChanges(state: GameState, changes: Record<string, unknown>): void {
    // Position changes
    if (changes.heroPosition) {
      state.heroPosition = changes.heroPosition as Position;
    }

    // HP changes
    if (changes.heroHp !== undefined) {
      state.hero.stats.currentHp = changes.heroHp as number;
      if (state.hero.stats.currentHp <= 0) {
        state.isAlive = false;
      }
    }

    if (changes.heroHpChange !== undefined) {
      state.hero.stats.currentHp = Math.min(
        state.hero.stats.maxHp,
        Math.max(0, state.hero.stats.currentHp + (changes.heroHpChange as number))
      );
    }

    // Inventory changes
    if (changes.inventory) {
      state.inventory = changes.inventory as typeof state.inventory;
    }

    if (changes.goldChange !== undefined) {
      state.inventory.gold += changes.goldChange as number;
    }

    // Combat state changes
    if (changes.combatState !== undefined) {
      state.combatState = changes.combatState as typeof state.combatState;
    }

    // Dialogue state changes
    if (changes.dialogueState !== undefined) {
      state.dialogueState = changes.dialogueState as typeof state.dialogueState;
    }

    // Chest opened
    if (changes.chestOpened) {
      state.worldState.openedChests.add(changes.chestOpened as string);
      const chest = state.worldState.chests.get(changes.chestOpened as string);
      if (chest) {
        chest.isOpen = true;
      }
    }

    // Enemy defeated
    if (changes.enemyDefeated && state.combatState) {
      const enemyId = state.combatState.enemyId;
      const enemy = state.worldState.enemies.get(enemyId);

      if (enemy && enemy.respawnTime > 0) {
        state.worldState.killedEnemies.set(enemyId, state.currentTurn + enemy.respawnTime);
      }
      state.worldState.enemies.delete(enemyId);
      state.combatState = null;

      // Award XP
      if (changes.xpReward) {
        const { newStats, leveledUp } = this.combatSystem.awardXP(state, changes.xpReward as number);
        state.hero.stats = newStats;
        if (leveledUp) {
          state.consoleOutput.push(`Level up! You are now level ${newStats.level}!`);
        }
      }

      // Award gold
      if (changes.coinReward) {
        state.inventory.gold += changes.coinReward as number;
      }
    }

    // Item received
    if (changes.itemReceived) {
      const { item, quantity } = changes.itemReceived as { item: AnyItem; quantity: number };
      const { newInventory } = this.inventorySystem.addItem(state.inventory, item, quantity);
      state.inventory = newInventory;
    }
  }

  /**
   * Process end of turn (enemy AI, respawns, etc.)
   */
  processEndOfTurn(state: GameState): GameState {
    const newState = cloneGameState(state);

    // Process enemy AI if in combat
    if (newState.combatState && newState.isAlive) {
      const enemy = newState.worldState.enemies.get(newState.combatState.enemyId);
      if (enemy) {
        const result = this.combatSystem.processEnemyTurn(newState, enemy);
        if (result.stateChanges) {
          this.applyStateChanges(newState, result.stateChanges);
        }
        newState.consoleOutput.push(result.message);
      }
    }

    // Process status effects
    const { hpChange, effects } = this.combatSystem.processStatusEffects(newState);
    newState.hero.stats.currentHp = Math.max(
      0,
      Math.min(newState.hero.stats.maxHp, newState.hero.stats.currentHp + hpChange)
    );
    newState.hero.statusEffects = effects;

    if (newState.hero.stats.currentHp <= 0) {
      newState.isAlive = false;
    }

    // Increment turn
    newState.currentTurn++;

    return newState;
  }

  /**
   * Run a full simulation with a list of actions
   */
  simulate(actions: Action[], maxActions: number = 200): SimulationResult {
    const turnStates: GameState[] = [];
    let state = this.createInitialState();
    turnStates.push(cloneGameState(state));

    for (let i = 0; i < actions.length && i < maxActions; i++) {
      state = this.executeAction(state, actions[i]);
      state = this.processEndOfTurn(state);
      turnStates.push(cloneGameState(state));

      if (!state.isAlive) {
        break;
      }
    }

    return {
      success: state.isAlive,
      finalState: state,
      turnStates,
      error: !state.isAlive ? 'Hero was defeated!' : undefined,
    };
  }

  /**
   * Get current zone data
   */
  getCurrentZone(): ZoneData {
    return this.currentZone;
  }

  /**
   * Change to a different zone
   */
  changeZone(zoneId: string, state: GameState): GameState {
    const newZone = this.worldData.zones.find((z) => z.id === zoneId);
    if (!newZone) {
      throw new Error(`Zone ${zoneId} not found`);
    }

    this.currentZone = newZone;
    const newState = cloneGameState(state);
    newState.worldState.currentZoneId = zoneId;
    newState.worldState.discoveredZones.add(zoneId);

    // Clear and respawn entities for new zone
    newState.worldState.enemies.clear();
    newState.worldState.npcs.clear();
    newState.worldState.chests.clear();
    newState.worldState.itemDrops.clear();
    this.spawnEntities(newState);

    return newState;
  }
}
