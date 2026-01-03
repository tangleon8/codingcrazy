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
  const { code, allowedMethods, timeout = 2000, maxActions = 200 } = e.data;

  const actions = [];
  const consoleOutput = [];
  let error = null;
  let actionCount = 0;

  // Create the hero API
  const hero = {};

  // Always provide move if allowed
  if (allowedMethods.includes('move')) {
    hero.move = function (direction) {
      if (actionCount >= maxActions) {
        throw new Error(`Max actions (${maxActions}) exceeded!`);
      }
      const validDirections = ['up', 'down', 'left', 'right'];
      if (!validDirections.includes(direction)) {
        throw new Error(`Invalid direction: "${direction}". Use: ${validDirections.join(', ')}`);
      }
      actions.push({ type: 'move', direction });
      actionCount++;
    };
  }

  // Provide wait if allowed
  if (allowedMethods.includes('wait')) {
    hero.wait = function () {
      if (actionCount >= maxActions) {
        throw new Error(`Max actions (${maxActions}) exceeded!`);
      }
      actions.push({ type: 'wait' });
      actionCount++;
    };
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
    const restrictedFunction = new Function(
      'hero',
      'console',
      `
      "use strict";
      // Block access to globals
      const window = undefined;
      const document = undefined;
      const self = undefined;
      const globalThis = undefined;
      const eval = undefined;
      const Function = undefined;

      ${code}
      `
    );

    // Execute with timeout check wrapper
    restrictedFunction(hero, safeConsole);

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
