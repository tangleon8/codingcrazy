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
    playerStart: { x: 1, y: 6 },
    enemyStart: null,
    goal: { x: 6, y: 1 },
    obstacles: [
      { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 3 },
    ],
    coins: [{ x: 2, y: 4 }, { x: 5, y: 2 }],
    instructions: `# First Steps

Welcome, young adventurer! 🧙‍♂️

Your hero needs to reach the **green goal** tile.

Use these commands:
- \`hero.moveRight()\` - Move right
- \`hero.moveUp()\` - Move up

**Tip:** Commands run in order, one after another!

Get to the goal to complete the quest!`,
    starterCode: `// Move your hero to the goal!
// Use hero.moveRight() and hero.moveUp()

hero.moveRight();
hero.moveRight();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  2: {
    playerStart: { x: 0, y: 4 },
    enemyStart: null,
    goal: { x: 7, y: 4 },
    obstacles: [
      { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
    ],
    coins: [{ x: 3, y: 2 }, { x: 4, y: 6 }, { x: 6, y: 4 }],
    instructions: `# Moving Forward

The path is blocked! You need to go around obstacles.

Use:
- \`hero.moveRight()\`
- \`hero.moveUp()\`
- \`hero.moveDown()\`

Plan your path around the trees!`,
    starterCode: `// Navigate around the obstacles!

hero.moveRight();
hero.moveUp();
`,
    allowedCommands: ['moveRight', 'moveUp', 'moveDown', 'moveLeft'],
  },
  3: {
    playerStart: { x: 1, y: 1 },
    enemyStart: { x: 6, y: 6 },
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 },
    ],
    coins: [{ x: 2, y: 1 }, { x: 5, y: 0 }, { x: 4, y: 3 }],
    instructions: `# Watch Out!

A wild boar appeared! 🐗

The boar will chase you each turn. Reach the goal before it catches you!

Move quickly and plan ahead!`,
    starterCode: `// Escape the boar and reach the goal!

hero.moveRight();
hero.moveRight();
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
      const caughtByEnemy = config.enemyStart &&
                            newEnemyPos.x === newPlayerPos.x &&
                            newEnemyPos.y === newPlayerPos.y;

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="border-b border-gray-700 bg-gray-900/90 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <Link href="/quests" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <span className="text-lg font-bold text-white">{quest.title}</span>
              <span className="text-sm text-gray-400">Quest #{quest.id}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-purple-400">+{quest.xpReward} XP</span>
              <span className="text-sm text-yellow-400">+{quest.coinReward} coins</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Game Canvas */}
          <div className="flex flex-col gap-4">
            {/* Game Board */}
            <div
              className="rounded-xl border-4 border-green-800 overflow-hidden relative"
              style={{
                width: GRID_SIZE * CELL_SIZE + 16,
                height: GRID_SIZE * CELL_SIZE + 16,
                backgroundImage: `url(${ASSETS.background})`,
                backgroundSize: 'cover',
                padding: 8,
              }}
            >
              {/* Grid */}
              <div
                className="relative"
                style={{
                  width: GRID_SIZE * CELL_SIZE,
                  height: GRID_SIZE * CELL_SIZE,
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                }}
              >
                {/* Goal */}
                {gameState && (
                  <div
                    className="absolute rounded-lg transition-all duration-300"
                    style={{
                      left: gameState.goal.x * CELL_SIZE,
                      top: gameState.goal.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: 'rgba(34, 197, 94, 0.6)',
                      border: '3px solid #22C55E',
                      boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🏁
                    </div>
                  </div>
                )}

                {/* Obstacles (Trees) */}
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
                    <img
                      src={ASSETS.tree}
                      alt="Tree"
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                ))}

                {/* Coins */}
                {gameState?.coins.map((coin, i) => {
                  const key = `${coin.x},${coin.y}`;
                  if (gameState.collectedCoins.has(key)) return null;
                  return (
                    <div
                      key={`coin-${i}`}
                      className="absolute flex items-center justify-center animate-bounce"
                      style={{
                        left: coin.x * CELL_SIZE,
                        top: coin.y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    >
                      <span className="text-3xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
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

                {/* Player */}
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
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${isRunning ? ASSETS.playerRun : ASSETS.playerIdle})`,
                        backgroundSize: `${CELL_SIZE * 4}px ${CELL_SIZE}px`,
                        backgroundPosition: '0 0',
                        imageRendering: 'pixelated',
                        animation: isRunning ? 'playerRun 0.4s steps(4) infinite' : 'playerIdle 0.8s steps(4) infinite',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Win/Lose Overlay */}
              {gameState && (gameState.isWon || gameState.isLost) && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: gameState.isWon ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.8)',
                  }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">
                      {gameState.isWon ? '🎉' : '💀'}
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {gameState.isWon ? 'Quest Complete!' : 'Try Again!'}
                    </div>
                    {gameState.isWon && (
                      <div className="mt-4 flex justify-center gap-1">
                        {[1, 2, 3].map(star => (
                          <span
                            key={star}
                            className="text-4xl"
                            style={{
                              color: star <= (gameState.collectedCoins.size === config.coins.length ? 3 :
                                     gameState.collectedCoins.size > 0 ? 2 : 1)
                                ? '#F59E0B' : '#4B5563',
                            }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Turn:</span>
                  <span className="text-white font-bold">{gameState?.turn || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Coins:</span>
                  <span className="text-yellow-400 font-bold">
                    {gameState?.collectedCoins.size || 0}/{config.coins.length}
                  </span>
                </div>
              </div>
              <div>
                {isRunning && (
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full animate-pulse">
                    Running...
                  </span>
                )}
                {gameState?.isWon && (
                  <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                    Success!
                  </span>
                )}
                {gameState?.isLost && (
                  <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                    Failed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Instructions + Code Editor */}
          <div className="flex flex-col gap-4">
            {/* Instructions */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: config.instructions
                    .replace(/^# (.+)$/gm, '<h2 class="text-xl font-bold text-green-400 mb-3">$1</h2>')
                    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="bg-gray-900 px-2 py-0.5 rounded text-green-400 font-mono">$1</code>')
                    .replace(/\n\n/g, '</p><p class="mb-2 text-gray-300">')
                    .replace(/\n/g, '<br>')
                }}
              />
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-[250px]">
              <div className="h-full bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                  <span className="text-sm text-gray-400 font-mono">main.js</span>
                  <span className="text-xs text-gray-500">Write your commands here</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isRunning}
                  className="w-full h-[calc(100%-40px)] bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none focus:outline-none"
                  style={{ minHeight: 200 }}
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Console */}
            <div className="bg-gray-900 rounded-xl border border-gray-700 h-32 overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                <span className="text-sm text-gray-400">Console</span>
              </div>
              <div className="p-3 h-[calc(100%-36px)] overflow-y-auto font-mono text-sm">
                {consoleOutput.map((line, i) => (
                  <div key={i} className="text-gray-300">{line}</div>
                ))}
                {error && (
                  <div className="text-red-400">Error: {error}</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex-1 py-3 rounded-lg font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
                  boxShadow: '0 4px 0 #15803D',
                }}
              >
                {isRunning ? '⏳ Running...' : '▶ Run Code'}
              </button>
              <button
                onClick={initGame}
                className="py-3 px-6 rounded-lg font-bold text-white transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg, #4B5563 0%, #374151 100%)',
                  boxShadow: '0 4px 0 #1F2937',
                }}
              >
                ↻ Reset
              </button>
              {gameState?.isWon && (
                <button
                  onClick={handleComplete}
                  className="py-3 px-6 rounded-lg font-bold text-white transition-all hover:brightness-110"
                  style={{
                    background: 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)',
                    boxShadow: '0 4px 0 #6D28D9',
                  }}
                >
                  ✓ Complete Quest
                </button>
              )}
            </div>
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
      `}</style>
    </div>
  );
}
