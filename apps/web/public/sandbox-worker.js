/**
 * Sandbox Worker for executing user code safely
 *
 * SECURITY NOTES:
 * - This worker runs in a separate context from the main thread
 * - We block access to network APIs (fetch, XMLHttpRequest)
 * - We don't have access to DOM, window, or document
 * - We enforce timeout and max action limits
 *
 * MVP LIMITATIONS (would need hardening for production):
 * - User could potentially do CPU-intensive operations before timeout
 * - No memory limits enforced
 * - No protection against prototype pollution
 * - For production: consider using vm2, isolated-vm, or server-side execution
 */

// Block network APIs
self.fetch = undefined;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = () => {
  throw new Error('importScripts is not allowed');
};

// Message handler
self.onmessage = function (e) {
  const {
    code,
    allowedMethods,
    timeout = 2000,
    maxActions = 200,
    gameContext = null, // New: provides game state for queries
  } = e.data;

  const actions = [];
  const consoleOutput = [];
  let error = null;
  let actionCount = 0;

  // Helper to add an action
  function addAction(action) {
    if (actionCount >= maxActions) {
      throw new Error(`Max actions (${maxActions}) exceeded!`);
    }
    actions.push(action);
    actionCount++;
  }

  // Create the hero API
  const hero = {};

  // ===============================
  // MOVEMENT ACTIONS
  // ===============================

  if (allowedMethods.includes('move')) {
    hero.move = function (direction) {
      const validDirections = ['up', 'down', 'left', 'right'];
      if (!validDirections.includes(direction)) {
        throw new Error(`Invalid direction: "${direction}". Use: ${validDirections.join(', ')}`);
      }
      addAction({ type: 'move', direction });
    };

    // Convenience methods
    hero.moveUp = function () {
      addAction({ type: 'move', direction: 'up' });
    };
    hero.moveDown = function () {
      addAction({ type: 'move', direction: 'down' });
    };
    hero.moveLeft = function () {
      addAction({ type: 'move', direction: 'left' });
    };
    hero.moveRight = function () {
      addAction({ type: 'move', direction: 'right' });
    };
  }

  if (allowedMethods.includes('wait')) {
    hero.wait = function () {
      addAction({ type: 'wait' });
    };
  }

  // ===============================
  // COMBAT ACTIONS
  // ===============================

  if (allowedMethods.includes('attack')) {
    hero.attack = function (targetId) {
      addAction({ type: 'attack', targetId: targetId ? String(targetId) : undefined });
    };
  }

  if (allowedMethods.includes('defend')) {
    hero.defend = function () {
      addAction({ type: 'defend' });
    };
  }

  if (allowedMethods.includes('flee')) {
    hero.flee = function () {
      addAction({ type: 'flee' });
    };
  }

  // ===============================
  // INVENTORY ACTIONS
  // ===============================

  if (allowedMethods.includes('useItem')) {
    hero.useItem = function (itemName) {
      if (!itemName) {
        throw new Error('useItem() requires an item name. Example: hero.useItem("potion")');
      }
      addAction({ type: 'useItem', itemId: String(itemName) });
    };
  }

  if (allowedMethods.includes('equip')) {
    hero.equip = function (itemName) {
      if (!itemName) {
        throw new Error('equip() requires an item name. Example: hero.equip("sword")');
      }
      addAction({ type: 'equip', itemId: String(itemName) });
    };
  }

  if (allowedMethods.includes('unequip')) {
    hero.unequip = function (slot) {
      if (!slot) {
        throw new Error('unequip() requires a slot. Example: hero.unequip("weapon")');
      }
      addAction({ type: 'unequip', slot: String(slot) });
    };
  }

  if (allowedMethods.includes('pickUp')) {
    hero.pickUp = function (itemId) {
      addAction({ type: 'pickUp', itemDropId: itemId ? String(itemId) : undefined });
    };
  }

  if (allowedMethods.includes('drop')) {
    hero.drop = function (itemName, quantity = 1) {
      if (!itemName) {
        throw new Error('drop() requires an item name. Example: hero.drop("potion", 1)');
      }
      addAction({ type: 'drop', itemId: String(itemName), quantity: Number(quantity) });
    };
  }

  // ===============================
  // INTERACTION ACTIONS
  // ===============================

  if (allowedMethods.includes('talk')) {
    hero.talk = function (npcName) {
      addAction({ type: 'talk', npcId: npcName ? String(npcName) : undefined });
    };
  }

  if (allowedMethods.includes('openChest')) {
    hero.openChest = function (chestId) {
      addAction({ type: 'openChest', chestId: chestId ? String(chestId) : undefined });
    };
  }

  if (allowedMethods.includes('buy')) {
    hero.buy = function (itemName, quantity = 1) {
      if (!itemName) {
        throw new Error('buy() requires an item name. Example: hero.buy("potion", 3)');
      }
      addAction({ type: 'buy', itemId: String(itemName), quantity: Number(quantity) });
    };
  }

  if (allowedMethods.includes('sell')) {
    hero.sell = function (itemName, quantity = 1) {
      if (!itemName) {
        throw new Error('sell() requires an item name. Example: hero.sell("sword", 1)');
      }
      addAction({ type: 'sell', itemId: String(itemName), quantity: Number(quantity) });
    };
  }

  if (allowedMethods.includes('selectOption')) {
    hero.selectOption = function (optionIndex) {
      if (typeof optionIndex !== 'number') {
        throw new Error('selectOption() requires a number. Example: hero.selectOption(0)');
      }
      addAction({ type: 'selectDialogOption', optionIndex: Number(optionIndex) });
    };
  }

  // ===============================
  // STATE QUERIES (Read-only)
  // ===============================

  // These don't count as actions - they just return information
  if (gameContext) {
    hero.getHp = function () {
      return gameContext.hp || 0;
    };

    hero.getMaxHp = function () {
      return gameContext.maxHp || 100;
    };

    hero.getMp = function () {
      return gameContext.mp || 0;
    };

    hero.getMaxMp = function () {
      return gameContext.maxMp || 50;
    };

    hero.getLevel = function () {
      return gameContext.level || 1;
    };

    hero.getGold = function () {
      return gameContext.gold || 0;
    };

    hero.getPosition = function () {
      return gameContext.position || { x: 0, y: 0 };
    };

    hero.isEnemyNearby = function () {
      return gameContext.nearbyEnemies && gameContext.nearbyEnemies.length > 0;
    };

    hero.isNpcNearby = function () {
      return gameContext.nearbyNpcs && gameContext.nearbyNpcs.length > 0;
    };

    hero.isChestNearby = function () {
      return gameContext.nearbyChests && gameContext.nearbyChests.length > 0;
    };

    hero.isItemNearby = function () {
      return gameContext.nearbyItems && gameContext.nearbyItems.length > 0;
    };

    hero.getNearbyEnemies = function () {
      return Object.freeze(gameContext.nearbyEnemies || []);
    };

    hero.getNearbyNpcs = function () {
      return Object.freeze(gameContext.nearbyNpcs || []);
    };

    hero.getInventory = function () {
      return Object.freeze(gameContext.inventory || []);
    };

    hero.hasItem = function (itemName) {
      if (!gameContext.inventory) return false;
      return gameContext.inventory.some(item => item.name === itemName || item.id === itemName);
    };

    hero.getItemCount = function (itemName) {
      if (!gameContext.inventory) return 0;
      const item = gameContext.inventory.find(i => i.name === itemName || i.id === itemName);
      return item ? item.quantity : 0;
    };

    hero.isInCombat = function () {
      return gameContext.inCombat || false;
    };

    hero.getEnemy = function () {
      return gameContext.currentEnemy ? Object.freeze(gameContext.currentEnemy) : null;
    };
  } else {
    // Provide stub functions that return safe defaults
    hero.getHp = () => 100;
    hero.getMaxHp = () => 100;
    hero.getMp = () => 50;
    hero.getMaxMp = () => 50;
    hero.getLevel = () => 1;
    hero.getGold = () => 0;
    hero.getPosition = () => ({ x: 0, y: 0 });
    hero.isEnemyNearby = () => false;
    hero.isNpcNearby = () => false;
    hero.isChestNearby = () => false;
    hero.isItemNearby = () => false;
    hero.getNearbyEnemies = () => [];
    hero.getNearbyNpcs = () => [];
    hero.getInventory = () => [];
    hero.hasItem = () => false;
    hero.getItemCount = () => 0;
    hero.isInCombat = () => false;
    hero.getEnemy = () => null;
  }

  // Freeze the hero object to prevent modifications
  Object.freeze(hero);

  // Create a safe console
  const safeConsole = {
    log: function (...args) {
      consoleOutput.push(args.map(String).join(' '));
    },
    error: function (...args) {
      consoleOutput.push('[ERROR] ' + args.map(String).join(' '));
    },
    warn: function (...args) {
      consoleOutput.push('[WARN] ' + args.map(String).join(' '));
    },
  };

  // Set up timeout
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
  }, timeout);

  try {
    // Create a function with restricted scope
    // The user code can only access: hero, console
    // We pass undefined values for dangerous globals as parameters
    const restrictedFunction = new Function(
      'hero',
      'console',
      'window',
      'document',
      'self',
      'globalThis',
      code
    );

    // Execute with undefined values for dangerous globals
    restrictedFunction(hero, safeConsole, undefined, undefined, undefined, undefined);

    clearTimeout(timeoutId);

    if (timedOut) {
      error = 'Code execution timed out!';
    }
  } catch (e) {
    clearTimeout(timeoutId);
    error = e.message || 'Unknown error occurred';
  }

  // Send results back
  self.postMessage({
    actions,
    consoleOutput,
    error,
  });
};
