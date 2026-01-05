'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LEVEL_1_QUESTS } from '@/features/quest-map-v2/data/level1Quests';

// Grid settings
const GRID_SIZE = 8;
const CELL_SIZE = 64;

// Asset paths
const ASSETS = {
  background: '/assets/dungeon/forest/Background/Background.png',
  playerIdle: '/assets/dungeon/forest/Character/Idle/Idle-Sheet.png',
  playerRun: '/assets/dungeon/forest/Character/Run/Run-Sheet.png',
  boarIdle: '/assets/dungeon/forest/Mob/Boar/Idle/Idle-Sheet.png',
  boarRun: '/assets/dungeon/forest/Mob/Boar/Run/Run-Sheet.png',
  tree: '/assets/dungeon/forest/Trees/Green-Tree.png',
  darkTree: '/assets/dungeon/forest/Trees/Dark-Tree.png',
};

// Forest theme constants
const FOREST_THEME = {
  colors: {
    gridLine: 'rgba(74, 124, 63, 0.12)',
    vignette: 'rgba(0, 20, 0, 0.6)',
    lightRay: 'rgba(255, 248, 220, 0.08)',
    goalGlow: 'rgba(144, 238, 144, 0.6)',
    goalBorder: '#6B8E23',
    coinGold: '#FFD700',
    shadow: 'rgba(0, 0, 0, 0.35)',
  },
};

interface Position {
  x: number;
  y: number;
}

interface GameState {
  player: Position;
  enemy: Position;
  goal: Position;
  obstacles: Position[];
  coins: Position[];
  collectedCoins: Set<string>;
  isWon: boolean;
  isLost: boolean;
  turn: number;
  message: string;
}

type Command = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'wait';

// Quest-specific configurations
const QUEST_CONFIGS: Record<number, {
  playerStart: Position;
  enemyStart: Position | null;
  goal: Position;
  obstacles: Position[];
  coins: Position[];
  instructions: string;
  starterCode: string;
  allowedCommands: Command[];
}> = {
  1: {
    playerStart: { x: 1, y: 4 },
    enemyStart: null,
    goal: { x: 5, y: 4 },
    obstacles: [],
    coins: [{ x: 3, y: 4 }],
    instructions: `# Your First Code

**Welcome to coding!** You're about to write real code.

## What is Code?
Code is a set of **instructions** that tell the computer (or hero!) what to do. Each instruction runs **one at a time**, from top to bottom.

## Your Mission
Move your hero → to the glowing goal ⭐

## The Command
Type this in the code editor:
\`\`\`
hero.moveRight()
\`\`\`

This tells your hero to take **one step right**.

## How to Play
1. Type the command in the editor
2. Click the **▶ Run Code** button
3. Watch your hero move!

## Challenge
The goal is **4 steps** to the right. Can you figure out how many \`hero.moveRight()\` commands you need?

**Hint:** Each command = one step. You need 4 commands!`,
    starterCode: `// Welcome! This is the CODE EDITOR
// Lines starting with // are "comments" - they don't run

// Type your commands below this line:
hero.moveRight()

// Need more moves? Add them below!
// Remember: the goal is 4 steps away

`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  2: {
    playerStart: { x: 0, y: 4 },
    enemyStart: null,
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 2, y: 4 },
    ],
    coins: [{ x: 2, y: 3 }, { x: 3, y: 4 }],
    instructions: `# New Directions

**Great job on Quest 1!** Now let's learn more commands.

## New Commands
You can move in **4 directions**:
- \`hero.moveRight()\` → Move right
- \`hero.moveLeft()\` ← Move left
- \`hero.moveUp()\` ↑ Move up
- \`hero.moveDown()\` ↓ Move down

## The Problem
There's a **tree** blocking your path! You can't walk through trees.

## The Solution
Go **around** the obstacle:
1. Move right once
2. Move **up** to go around the tree
3. Move right to pass the tree
4. Move **down** to get back on track
5. Move right to reach the goal

## Key Concept: Sequences
Code runs **line by line**, top to bottom. The order matters!

\`\`\`
hero.moveRight()  // runs first
hero.moveUp()     // runs second
hero.moveRight()  // runs third
\`\`\``,
    starterCode: `// Time to go around the tree!
// The tree is blocking the direct path

hero.moveRight()
hero.moveUp()

// Add more commands to get around the tree
// and reach the goal!

`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  3: {
    playerStart: { x: 1, y: 4 },
    enemyStart: { x: 6, y: 4 },
    goal: { x: 1, y: 1 },
    obstacles: [],
    coins: [{ x: 1, y: 2 }, { x: 1, y: 3 }],
    instructions: `# Danger! The Boar

**Watch out!** A wild boar has appeared! 🐗

## How the Boar Works
- The boar **chases you** every turn
- After YOU move, the boar moves ONE step toward you
- If the boar catches you, you lose!

## Your Strategy
The goal is **above you** (up), not to the right.

The boar starts far away on the right. If you move **up** toward the goal, you'll reach it before the boar catches you!

## Counting Turns
You need **3 moves up** to reach the goal.
The boar needs **5+ moves** to reach you.

You have time - but don't waste moves!

## Tip
Think about the **shortest path** to the goal. Extra moves give the boar more time to catch you!`,
    starterCode: `// The boar is coming! Run to the goal!
// The goal is UP - go straight up!

hero.moveUp()

// Add 2 more moveUp() commands to reach the goal

`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  4: {
    playerStart: { x: 0, y: 7 },
    enemyStart: null,
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 },
      { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
      { x: 2, y: 1 }, { x: 3, y: 1 },
    ],
    coins: [{ x: 0, y: 4 }, { x: 4, y: 2 }, { x: 7, y: 1 }],
    instructions: `# Collect the Coins

Reach the goal AND collect all 3 coins for maximum stars!

Plan your route carefully to grab every coin along the way.

Use all four directions:
- \`hero.moveUp()\`
- \`hero.moveDown()\`
- \`hero.moveLeft()\`
- \`hero.moveRight()\``,
    starterCode: `// Collect coins on your way to the goal!

hero.moveUp();
hero.moveUp();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  5: {
    playerStart: { x: 0, y: 0 },
    enemyStart: { x: 7, y: 7 },
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 3, y: 0 }, { x: 3, y: 1 },
      { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 },
    ],
    coins: [{ x: 2, y: 0 }, { x: 5, y: 1 }, { x: 6, y: 0 }],
    instructions: `# Avoid the Traps

The boar is watching from afar!

Navigate through the forest obstacles and reach the goal before the boar catches up.

**Tip:** The boar moves toward you each turn. Plan your moves wisely!`,
    starterCode: `// Escape to the goal!
// The boar is chasing you!

hero.moveRight();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  6: {
    playerStart: { x: 0, y: 4 },
    enemyStart: null,
    goal: { x: 0, y: 4 },
    obstacles: [
      { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 }, { x: 2, y: 6 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 },
    ],
    coins: [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }],
    instructions: `# Loop Practice

Collect ALL 4 coins and return to your starting position!

This is a round trip - you need to go right, grab the coins, and come back.

**Hint:** Think about how many moves right... then the same moves left!`,
    starterCode: `// Collect all coins and return home!
// Go right, then come back left

hero.moveUp();
hero.moveRight();
hero.moveRight();
hero.moveRight();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  7: {
    playerStart: { x: 0, y: 7 },
    enemyStart: { x: 4, y: 4 },
    goal: { x: 7, y: 7 },
    obstacles: [
      { x: 1, y: 6 }, { x: 2, y: 6 },
      { x: 3, y: 4 }, { x: 3, y: 5 },
      { x: 5, y: 6 }, { x: 6, y: 6 },
    ],
    coins: [{ x: 2, y: 7 }, { x: 4, y: 7 }, { x: 6, y: 7 }],
    instructions: `# Complex Path

The boar guards the center of the forest!

Find a path around the obstacles while avoiding the boar.

**Strategy:** Sometimes going up and around is safer than straight through!`,
    starterCode: `// Navigate the complex path!
// Avoid the boar in the center

hero.moveUp();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  8: {
    playerStart: { x: 0, y: 0 },
    enemyStart: { x: 0, y: 7 },
    goal: { x: 7, y: 7 },
    obstacles: [
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
      { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
    ],
    coins: [{ x: 1, y: 0 }, { x: 5, y: 3 }, { x: 7, y: 6 }],
    instructions: `# Speed Run

The boar is fast and determined!

You need to reach the goal in the minimum number of moves. The boar starts close - every move counts!

**Challenge:** Can you complete this with fewer than 12 moves?`,
    starterCode: `// Race to the goal!
// Be fast - the boar is coming!

hero.moveRight();
hero.moveDown();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  9: {
    playerStart: { x: 0, y: 3 },
    enemyStart: { x: 7, y: 3 },
    goal: { x: 4, y: 7 },
    obstacles: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 },
    ],
    coins: [{ x: 1, y: 0 }, { x: 3, y: 6 }, { x: 6, y: 7 }],
    instructions: `# Final Challenge

This is a maze! The boar is on the other side.

Navigate through the narrow corridors to reach the goal at the bottom.

**Warning:** Dead ends mean the boar will catch you!`,
    starterCode: `// Solve the maze!
// Plan your path carefully

hero.moveUp();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  10: {
    playerStart: { x: 0, y: 0 },
    enemyStart: { x: 3, y: 3 },
    goal: { x: 7, y: 7 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 1, y: 4 }, { x: 2, y: 4 },
      { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 6, y: 6 },
    ],
    coins: [{ x: 3, y: 0 }, { x: 0, y: 3 }, { x: 6, y: 4 }, { x: 7, y: 6 }],
    instructions: `# Forest Guardian

The boar guardian patrols the heart of the forest!

This is the ultimate test. Collect all coins and reach the goal while evading the guardian.

**Master Challenge:** Complete with all 4 coins for 3 stars!

Good luck, adventurer! 🌟`,
    starterCode: `// Defeat the Forest Guardian challenge!
// Collect all coins and reach the goal

hero.moveRight();
hero.moveRight();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
};

// Default config for quests without specific configuration
const DEFAULT_CONFIG = {
  playerStart: { x: 1, y: 6 },
  enemyStart: { x: 6, y: 1 },
  goal: { x: 7, y: 7 },
  obstacles: [] as Position[],
  coins: [] as Position[],
  instructions: 'Reach the goal while avoiding the enemy!',
  starterCode: `// Write your code here
hero.moveRight();
`,
  allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'] as Command[],
};

export default function QuestPlayPage() {
  const router = useRouter();
  const params = useParams();
  const questId = parseInt(params.questId as string);
  const { user, isLoading: authLoading } = useAuth();

  const quest = LEVEL_1_QUESTS.find(q => q.id === questId);
  const config = QUEST_CONFIGS[questId] || DEFAULT_CONFIG;

  const [code, setCode] = useState(config.starterCode);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const commandQueueRef = useRef<Command[]>([]);

  // Initialize game state
  const initGame = useCallback(() => {
    setGameState({
      player: { ...config.playerStart },
      enemy: config.enemyStart ? { ...config.enemyStart } : { x: -10, y: -10 },
      goal: { ...config.goal },
      obstacles: [...config.obstacles],
      coins: [...config.coins],
      collectedCoins: new Set(),
      isWon: false,
      isLost: false,
      turn: 0,
      message: '',
    });
    setConsoleOutput([]);
    setError(null);
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [config]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Parse and execute code
  const runCode = useCallback(() => {
    if (!gameState) return;

    setIsRunning(true);
    setConsoleOutput([]);
    setError(null);

    // Reset game state
    const newState: GameState = {
      player: { ...config.playerStart },
      enemy: config.enemyStart ? { ...config.enemyStart } : { x: -10, y: -10 },
      goal: { ...config.goal },
      obstacles: [...config.obstacles],
      coins: [...config.coins],
      collectedCoins: new Set(),
      isWon: false,
      isLost: false,
      turn: 0,
      message: '',
    };

    // Parse commands from code
    const commands: Command[] = [];
    const lines = code.split('\n');
    const output: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || !trimmed) continue;

      if (trimmed.includes('hero.moveRight')) {
        commands.push('moveRight');
        output.push('> hero.moveRight()');
      } else if (trimmed.includes('hero.moveLeft')) {
        commands.push('moveLeft');
        output.push('> hero.moveLeft()');
      } else if (trimmed.includes('hero.moveUp')) {
        commands.push('moveUp');
        output.push('> hero.moveUp()');
      } else if (trimmed.includes('hero.moveDown')) {
        commands.push('moveDown');
        output.push('> hero.moveDown()');
      } else if (trimmed.includes('hero.wait')) {
        commands.push('wait');
        output.push('> hero.wait()');
      } else if (trimmed.includes('console.log')) {
        const match = trimmed.match(/console\.log\(['"](.*)['"]\)/);
        if (match) {
          output.push(match[1]);
        }
      }
    }

    if (commands.length === 0) {
      setError('No commands found! Use hero.moveRight(), hero.moveUp(), etc.');
      setIsRunning(false);
      return;
    }

    setConsoleOutput(output);
    commandQueueRef.current = commands;
    setGameState(newState);

    // Execute commands with animation
    let currentIndex = 0;
    let currentState = { ...newState };

    const executeNextCommand = () => {
      if (currentIndex >= commands.length || currentState.isWon || currentState.isLost) {
        setIsRunning(false);
        if (!currentState.isWon && !currentState.isLost) {
          setError('You didn\'t reach the goal! Try adding more moves.');
        }
        return;
      }

      const cmd = commands[currentIndex];
      const newPlayerPos = { ...currentState.player };

      // Execute player move
      switch (cmd) {
        case 'moveRight':
          newPlayerPos.x = Math.min(GRID_SIZE - 1, newPlayerPos.x + 1);
          break;
        case 'moveLeft':
          newPlayerPos.x = Math.max(0, newPlayerPos.x - 1);
          break;
        case 'moveUp':
          newPlayerPos.y = Math.max(0, newPlayerPos.y - 1);
          break;
        case 'moveDown':
          newPlayerPos.y = Math.min(GRID_SIZE - 1, newPlayerPos.y + 1);
          break;
      }

      // Check obstacle collision
      const hitObstacle = currentState.obstacles.some(
        o => o.x === newPlayerPos.x && o.y === newPlayerPos.y
      );

      if (hitObstacle) {
        newPlayerPos.x = currentState.player.x;
        newPlayerPos.y = currentState.player.y;
        setConsoleOutput(prev => [...prev, '⚠️ Blocked by obstacle!']);
      }

      // Check coin collection
      const newCollected = new Set(currentState.collectedCoins);
      const coinKey = `${newPlayerPos.x},${newPlayerPos.y}`;
      if (currentState.coins.some(c => c.x === newPlayerPos.x && c.y === newPlayerPos.y)) {
        if (!newCollected.has(coinKey)) {
          newCollected.add(coinKey);
          setConsoleOutput(prev => [...prev, '🪙 Coin collected!']);
        }
      }

      // Check win condition
      const reachedGoal = newPlayerPos.x === currentState.goal.x &&
                          newPlayerPos.y === currentState.goal.y;

      // Move enemy towards player
      const newEnemyPos = { ...currentState.enemy };
      if (config.enemyStart) {
        if (newEnemyPos.x < newPlayerPos.x) newEnemyPos.x++;
        else if (newEnemyPos.x > newPlayerPos.x) newEnemyPos.x--;
        else if (newEnemyPos.y < newPlayerPos.y) newEnemyPos.y++;
        else if (newEnemyPos.y > newPlayerPos.y) newEnemyPos.y--;
      }

      // Check if enemy caught player
      const caughtByEnemy = !!(config.enemyStart &&
                            newEnemyPos.x === newPlayerPos.x &&
                            newEnemyPos.y === newPlayerPos.y);

      currentState = {
        ...currentState,
        player: newPlayerPos,
        enemy: newEnemyPos,
        collectedCoins: newCollected,
        isWon: reachedGoal,
        isLost: caughtByEnemy,
        turn: currentState.turn + 1,
        message: reachedGoal ? '🎉 You reached the goal!' :
                 caughtByEnemy ? '💀 The boar caught you!' : '',
      };

      setGameState(currentState);
      currentIndex++;

      if (reachedGoal) {
        setConsoleOutput(prev => [...prev, '🎉 SUCCESS! Quest completed!']);
        setIsRunning(false);
        return;
      }

      if (caughtByEnemy) {
        setConsoleOutput(prev => [...prev, '💀 FAILED! The boar caught you!']);
        setError('The boar caught you! Try a different path.');
        setIsRunning(false);
        return;
      }

      // Next command after delay
      setTimeout(executeNextCommand, 500);
    };

    setTimeout(executeNextCommand, 300);
  }, [code, gameState, config]);

  const handleComplete = () => {
    // Save completion to localStorage and return to quests
    const stored = localStorage.getItem('questProgress');
    const progress = stored ? JSON.parse(stored) : {};
    const starsEarned = gameState?.collectedCoins.size === config.coins.length ? 3 :
                        gameState && gameState.collectedCoins.size > 0 ? 2 : 1;

    progress[questId] = {
      completed: true,
      starsEarned,
      completedAt: Date.now(),
    };

    localStorage.setItem('questProgress', JSON.stringify(progress));
    router.push('/quests');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Quest not found</div>
          <Link href="/quests" className="text-blue-400 hover:underline">
            Back to Quest Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Ambient background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 rounded-full bg-emerald-500/30 top-[10%] left-[15%] animate-pulse" />
        <div className="absolute w-3 h-3 rounded-full bg-blue-500/30 top-[25%] left-[40%] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-2 h-2 rounded-full bg-purple-500/30 top-[15%] left-[70%] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute w-3 h-3 rounded-full bg-emerald-500/30 top-[45%] left-[85%] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute w-2 h-2 rounded-full bg-blue-500/30 top-[60%] left-[25%] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute w-3 h-3 rounded-full bg-purple-500/30 top-[75%] left-[55%] animate-pulse" style={{ animationDelay: '2.5s' }} />
        <div className="absolute w-2 h-2 rounded-full bg-emerald-500/30 top-[85%] left-[10%] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute w-3 h-3 rounded-full bg-blue-500/30 top-[50%] left-[65%] animate-pulse" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-emerald-900/30 bg-gradient-to-r from-[#0d1f35]/95 via-[#0f2a1f]/95 to-[#0d1f35]/95 backdrop-blur-md shadow-lg shadow-black/20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/quests"
                className="group flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-emerald-500/50 hover:bg-emerald-900/20 transition-all duration-300"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
                  ⚔️
                </div>
                <div>
                  <span className="text-lg font-bold text-white block leading-tight">{quest.title}</span>
                  <span className="text-xs text-emerald-400/70">Quest #{quest.id} • Level 1</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30">
                <span className="text-lg">✨</span>
                <span className="text-sm font-semibold text-purple-300">+{quest.xpReward} XP</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/30 border border-yellow-500/30">
                <span className="text-lg">🪙</span>
                <span className="text-sm font-semibold text-yellow-300">+{quest.coinReward}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Game Canvas */}
          <div className="flex flex-col gap-5">
            {/* Game Board with decorative frame */}
            <div className="relative">
              {/* Outer glow */}
              <div
                className="absolute -inset-2 rounded-2xl opacity-50 blur-xl"
                style={{ background: 'linear-gradient(135deg, #22C55E 0%, #059669 50%, #047857 100%)' }}
              />

              {/* Decorative corner vines */}
              <div className="absolute -top-3 -left-3 text-3xl transform -rotate-45 opacity-70 z-20">🌿</div>
              <div className="absolute -top-3 -right-3 text-3xl transform rotate-45 opacity-70 z-20">🌿</div>
              <div className="absolute -bottom-3 -left-3 text-3xl transform rotate-45 opacity-70 z-20">🍃</div>
              <div className="absolute -bottom-3 -right-3 text-3xl transform -rotate-45 opacity-70 z-20">🍃</div>

              {/* Main frame */}
              <div
                className="relative rounded-xl overflow-hidden"
                style={{
                  width: GRID_SIZE * CELL_SIZE + 24,
                  height: GRID_SIZE * CELL_SIZE + 24,
                  background: 'linear-gradient(135deg, #1a4731 0%, #14532d 50%, #166534 100%)',
                  padding: 4,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.3)',
                }}
              >
                {/* Inner border */}
                <div
                  className="rounded-lg overflow-hidden relative"
                  style={{
                    width: GRID_SIZE * CELL_SIZE + 16,
                    height: GRID_SIZE * CELL_SIZE + 16,
                    backgroundImage: `url(${ASSETS.background})`,
                    backgroundSize: 'cover',
                    padding: 8,
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Vignette overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      background: `radial-gradient(ellipse at center, transparent 40%, ${FOREST_THEME.colors.vignette} 100%)`,
                      zIndex: 1,
                    }}
                  />
                  {/* Subtle light rays from top */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      background: `linear-gradient(180deg, ${FOREST_THEME.colors.lightRay} 0%, transparent 40%)`,
                      zIndex: 1,
                    }}
                  />
              {/* Grid */}
              <div
                className="relative"
                style={{
                  width: GRID_SIZE * CELL_SIZE,
                  height: GRID_SIZE * CELL_SIZE,
                  backgroundImage: `
                    linear-gradient(${FOREST_THEME.colors.gridLine} 1px, transparent 1px),
                    linear-gradient(90deg, ${FOREST_THEME.colors.gridLine} 1px, transparent 1px)
                  `,
                  backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                }}
              >
                {/* Goal - Forest Shrine */}
                {gameState && (
                  <div
                    className="absolute rounded-lg transition-all duration-300"
                    style={{
                      left: gameState.goal.x * CELL_SIZE,
                      top: gameState.goal.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: `
                        radial-gradient(ellipse at center, ${FOREST_THEME.colors.goalGlow} 0%, transparent 70%),
                        linear-gradient(180deg, #5D4E37 0%, #3D2E1F 100%)
                      `,
                      border: `3px solid ${FOREST_THEME.colors.goalBorder}`,
                      boxShadow: `0 0 20px ${FOREST_THEME.colors.goalGlow}, inset 0 0 15px rgba(144,238,144,0.3)`,
                      animation: 'goalPulse 2s ease-in-out infinite',
                    }}
                  >
                    {/* Inner glow ring */}
                    <div
                      className="absolute inset-2 rounded"
                      style={{
                        border: '2px solid rgba(144,238,144,0.5)',
                        background: 'radial-gradient(ellipse at center, rgba(144,238,144,0.2) 0%, transparent 60%)',
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-2xl relative z-10">
                      <span style={{ filter: 'drop-shadow(0 0 6px rgba(144,238,144,0.8))' }}>&#9733;</span>
                    </div>
                  </div>
                )}

                {/* Obstacles (Trees) with shadows */}
                {gameState?.obstacles.map((obs, i) => (
                  <div
                    key={`obs-${i}`}
                    className="absolute"
                    style={{
                      left: obs.x * CELL_SIZE,
                      top: obs.y * CELL_SIZE - 16,
                      width: CELL_SIZE,
                      height: CELL_SIZE + 16,
                    }}
                  >
                    {/* Shadow under tree */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        width: '80%',
                        height: 10,
                        background: `radial-gradient(ellipse, ${FOREST_THEME.colors.shadow} 0%, transparent 70%)`,
                        borderRadius: '50%',
                      }}
                    />
                    <img
                      src={i % 3 === 0 ? ASSETS.darkTree : ASSETS.tree}
                      alt="Tree"
                      className="w-full h-full object-contain relative"
                      style={{ imageRendering: 'pixelated', zIndex: 1 }}
                    />
                  </div>
                ))}

                {/* Coins with float and sparkle */}
                {gameState?.coins.map((coin, i) => {
                  const key = `${coin.x},${coin.y}`;
                  if (gameState.collectedCoins.has(key)) return null;
                  return (
                    <div
                      key={`coin-${i}`}
                      className="absolute flex items-center justify-center"
                      style={{
                        left: coin.x * CELL_SIZE,
                        top: coin.y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    >
                      {/* Coin shadow */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          width: 24,
                          height: 6,
                          background: `radial-gradient(ellipse, ${FOREST_THEME.colors.shadow} 0%, transparent 70%)`,
                          borderRadius: '50%',
                        }}
                      />
                      <span
                        className="text-3xl"
                        style={{
                          animation: 'coinFloat 2s ease-in-out infinite, coinSparkle 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.3}s`,
                        }}
                      >
                        🪙
                      </span>
                    </div>
                  );
                })}

                {/* Enemy (Boar) */}
                {gameState && config.enemyStart && (
                  <div
                    className="absolute transition-all duration-400"
                    style={{
                      left: gameState.enemy.x * CELL_SIZE,
                      top: gameState.enemy.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      transform: gameState.enemy.x < gameState.player.x ? 'scaleX(1)' : 'scaleX(-1)',
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${ASSETS.boarIdle})`,
                        backgroundSize: `${CELL_SIZE * 4}px ${CELL_SIZE}px`,
                        backgroundPosition: '0 0',
                        imageRendering: 'pixelated',
                        animation: 'boarIdle 0.6s steps(4) infinite',
                      }}
                    />
                  </div>
                )}

                {/* Player with shadow */}
                {gameState && (
                  <div
                    className="absolute transition-all duration-400"
                    style={{
                      left: gameState.player.x * CELL_SIZE,
                      top: gameState.player.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      zIndex: 10,
                    }}
                  >
                    {/* Player shadow */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 40,
                        height: 10,
                        background: `radial-gradient(ellipse, ${FOREST_THEME.colors.shadow} 0%, transparent 70%)`,
                        borderRadius: '50%',
                      }}
                    />
                    <div
                      className="w-full h-full relative"
                      style={{
                        backgroundImage: `url(${isRunning ? ASSETS.playerRun : ASSETS.playerIdle})`,
                        backgroundSize: `${CELL_SIZE * 4}px ${CELL_SIZE}px`,
                        backgroundPosition: '0 0',
                        imageRendering: 'pixelated',
                        animation: isRunning ? 'playerRun 0.4s steps(4) infinite' : 'playerIdle 0.8s steps(4) infinite',
                        zIndex: 1,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Win/Lose Overlay */}
              {gameState && (gameState.isWon || gameState.isLost) && (
                <div
                  className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
                  style={{
                    background: gameState.isWon
                      ? 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.9) 0%, rgba(22, 101, 52, 0.95) 100%)'
                      : 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.9) 0%, rgba(127, 29, 29, 0.95) 100%)',
                  }}
                >
                  {/* Celebration particles for win */}
                  {gameState.isWon && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute text-2xl"
                          style={{
                            left: `${10 + (i * 8)}%`,
                            animation: `confettiFall ${2 + Math.random()}s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        >
                          {['⭐', '✨', '🌟', '💫'][i % 4]}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center relative z-10">
                    <div
                      className="text-7xl mb-4"
                      style={{ animation: gameState.isWon ? 'celebrateBounce 0.6s ease-out' : 'shake 0.5s ease-in-out' }}
                    >
                      {gameState.isWon ? '🎉' : '💀'}
                    </div>
                    <div
                      className="text-4xl font-bold text-white mb-2"
                      style={{ textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
                    >
                      {gameState.isWon ? 'Quest Complete!' : 'Try Again!'}
                    </div>
                    {gameState.isWon && (
                      <>
                        <div className="mt-4 flex justify-center gap-2">
                          {[1, 2, 3].map(star => {
                            const earned = star <= (gameState.collectedCoins.size === config.coins.length ? 3 :
                                           gameState.collectedCoins.size > 0 ? 2 : 1);
                            return (
                              <span
                                key={star}
                                className="text-5xl transition-all duration-300"
                                style={{
                                  color: earned ? '#FBBF24' : '#374151',
                                  filter: earned ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : 'none',
                                  animation: earned ? `starPop 0.4s ease-out ${star * 0.15}s both` : 'none',
                                }}
                              >
                                ★
                              </span>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-emerald-200 text-sm">
                          Coins collected: {gameState.collectedCoins.size}/{config.coins.length}
                        </div>
                      </>
                    )}
                    {gameState.isLost && (
                      <div className="mt-3 text-red-200 text-sm">
                        Don&apos;t give up! Try a different approach.
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
              </div>
            </div>

            {/* Mini Legend */}
            <div
              className="flex items-center justify-center gap-6 mt-3 px-4 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(180deg, rgba(45, 90, 39, 0.4) 0%, rgba(29, 60, 25, 0.5) 100%)',
                border: '1px solid rgba(107, 142, 35, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 text-sm">
                <span>🪙</span>
                <span style={{ color: '#DAA520' }}>Collect coins</span>
              </div>
              <div className="w-px h-4 bg-green-800/50" />
              <div className="flex items-center gap-2 text-sm">
                <span style={{ filter: 'drop-shadow(0 0 4px rgba(144,238,144,0.6))' }}>&#9733;</span>
                <span style={{ color: '#90EE90' }}>Reach the goal</span>
              </div>
            </div>

            {/* Status Bar */}
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-600/20 via-blue-600/20 to-purple-600/20 blur-sm" />
              <div className="relative bg-gradient-to-r from-gray-800/95 to-gray-900/95 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
                      <span className="text-xl">⏱️</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Turn</div>
                      <div className="text-xl font-bold text-white">{gameState?.turn || 0}</div>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-gray-700" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-900/50 border border-yellow-500/30 flex items-center justify-center">
                      <span className="text-xl">🪙</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Coins</div>
                      <div className="text-xl font-bold">
                        <span className="text-yellow-400">{gameState?.collectedCoins.size || 0}</span>
                        <span className="text-gray-500">/{config.coins.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  {isRunning && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/40 text-blue-300 text-sm rounded-full">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      Running...
                    </div>
                  )}
                  {gameState?.isWon && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-sm rounded-full">
                      <span>✓</span> Success!
                    </div>
                  )}
                  {gameState?.isLost && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/40 text-red-300 text-sm rounded-full">
                      <span>✕</span> Failed
                    </div>
                  )}
                  {!isRunning && !gameState?.isWon && !gameState?.isLost && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/30 border border-gray-600/40 text-gray-400 text-sm rounded-full">
                      Ready
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Instructions + Code Editor */}
          <div className="flex flex-col gap-5">
            {/* Instructions */}
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

              <div className="relative bg-gradient-to-br from-[#1a1510] to-[#0f0d0a] rounded-xl border border-amber-900/30 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 bg-gradient-to-r from-amber-900/30 to-orange-900/20 border-b border-amber-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <span className="text-lg">📜</span>
                    </div>
                    <span className="text-amber-200 font-semibold">Quest Instructions</span>
                  </div>
                  <span className="text-xs text-amber-600/60 uppercase tracking-wider">Read carefully</span>
                </div>

                {/* Content - scrollable */}
                <div className="p-5 max-h-[320px] overflow-y-auto custom-scrollbar">
                  <div
                    className="prose prose-invert prose-sm max-w-none space-y-3"
                    dangerouslySetInnerHTML={{
                      __html: config.instructions
                        // Main title (# Header)
                        .replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold text-amber-200 mb-2 pb-2 border-b border-amber-900/30">$1</h2>')
                        // Section headers (## Header)
                        .replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold text-amber-400 uppercase tracking-wide mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>$1</h3>')
                        // Code blocks (```)
                        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900/80 rounded-lg p-3 my-2 border border-gray-700/50 overflow-x-auto"><code class="text-emerald-400 font-mono text-xs leading-relaxed">$1</code></pre>')
                        // Bold text
                        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-amber-100 font-semibold">$1</strong>')
                        // Inline code
                        .replace(/`([^`]+)`/g, '<code class="bg-gray-900/80 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs border border-gray-700/50">$1</code>')
                        // Numbered lists
                        .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-3 my-1.5"><span class="flex-shrink-0 w-5 h-5 bg-amber-900/40 rounded-full flex items-center justify-center text-xs text-amber-400 font-bold">$1</span><span class="text-gray-300">$2</span></div>')
                        // Bullet lists with code
                        .replace(/^- `([^`]+)` (.+)$/gm, '<div class="flex items-start gap-2 my-1.5 pl-1"><span class="text-amber-500 mt-0.5">→</span><code class="bg-gray-900/80 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs border border-gray-700/50">$1</code><span class="text-gray-400">$2</span></div>')
                        // Regular bullet lists
                        .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1.5 pl-1"><span class="text-amber-500 mt-1">•</span><span class="text-gray-300">$1</span></div>')
                        // Paragraphs
                        .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed">')
                        .replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-[220px] relative group">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

              <div className="h-full relative bg-[#0a0f14] rounded-xl border border-emerald-900/30 overflow-hidden shadow-2xl shadow-black/30">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0f1a1a] to-[#0a1414] px-4 py-2.5 border-b border-emerald-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-900/30 rounded-md border border-emerald-700/30">
                      <span className="text-emerald-400 text-xs">{'</>'}</span>
                      <span className="text-xs text-emerald-300 font-mono">Code Editor</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Type your code below</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-800/50 rounded text-gray-500 font-mono">JavaScript</span>
                  </div>
                </div>
                {/* Line numbers + Editor */}
                <div className="flex h-[calc(100%-48px)]">
                  {/* Line numbers */}
                  <div className="bg-[#080c10] text-gray-600 font-mono text-sm py-4 px-3 border-r border-gray-800/50 select-none">
                    {code.split('\n').map((_, i) => (
                      <div key={i} className="leading-6 text-right">{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isRunning}
                    className="flex-1 bg-transparent text-emerald-400 font-mono text-sm p-4 resize-none focus:outline-none leading-6 placeholder:text-gray-600"
                    style={{ minHeight: 200 }}
                    spellCheck={false}
                    placeholder="// Start coding here..."
                  />
                </div>
              </div>
            </div>

            {/* Console */}
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-gray-600/10 via-gray-500/10 to-gray-600/10 blur-sm" />
              <div className="relative bg-[#0a0a0c] rounded-xl border border-gray-800/50 h-36 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 px-4 py-2.5 border-b border-gray-800/50 flex items-center gap-2">
                  <span className="text-lg">💻</span>
                  <span className="text-sm text-gray-400 font-medium">Console Output</span>
                  {consoleOutput.length > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-500">
                      {consoleOutput.length} lines
                    </span>
                  )}
                </div>
                <div className="p-3 h-[calc(100%-42px)] overflow-y-auto font-mono text-sm space-y-1">
                  {consoleOutput.length === 0 && !error && (
                    <div className="text-gray-600 italic">Output will appear here...</div>
                  )}
                  {consoleOutput.map((line, i) => (
                    <div
                      key={i}
                      className={`${
                        line.includes('SUCCESS') ? 'text-emerald-400' :
                        line.includes('collected') ? 'text-yellow-400' :
                        line.includes('Blocked') ? 'text-orange-400' :
                        line.startsWith('>') ? 'text-cyan-400' :
                        'text-gray-400'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                  {error && (
                    <div className="text-red-400 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="group relative flex-1 py-4 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
                  boxShadow: '0 4px 0 #15803D, 0 8px 20px rgba(34, 197, 94, 0.3)',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                  {isRunning ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Running...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">▶</span>
                      Run Code
                    </>
                  )}
                </span>
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={initGame}
                className="group relative py-4 px-5 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #4B5563 0%, #374151 100%)',
                  boxShadow: '0 4px 0 #1F2937, 0 8px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-lg">↻</span>
                  Reset
                </span>
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Complete Quest Button - Shows when won */}
            {gameState?.isWon && (
              <button
                onClick={handleComplete}
                className="group relative w-full py-4 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 0 #6D28D9, 0 8px 20px rgba(139, 92, 246, 0.4)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                  <span className="text-xl">🎉</span>
                  Complete Quest & Claim Rewards!
                </span>
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes playerIdle {
          from { background-position: 0 0; }
          to { background-position: -${CELL_SIZE * 4}px 0; }
        }
        @keyframes playerRun {
          from { background-position: 0 0; }
          to { background-position: -${CELL_SIZE * 4}px 0; }
        }
        @keyframes boarIdle {
          from { background-position: 0 0; }
          to { background-position: -${CELL_SIZE * 4}px 0; }
        }
        @keyframes floatParticle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-40px) translateX(-5px);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-20px) translateX(15px);
            opacity: 0.5;
          }
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100%) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes celebrateBounce {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.3) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px) rotate(-3deg); }
          40% { transform: translateX(10px) rotate(3deg); }
          60% { transform: translateX(-10px) rotate(-3deg); }
          80% { transform: translateX(10px) rotate(3deg); }
        }
        @keyframes starPop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.4) rotate(20deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
