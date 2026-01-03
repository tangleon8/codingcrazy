'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { api, Level } from '@/lib/api';
import { useCodeRunner } from '@/hooks/use-code-runner';
import { GameSimulator, GameState, LevelData, Action } from '@codingcrazy/engine';
import Console from '@/components/Console';

// Dynamic imports for heavy components
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false });
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });

type PlayState = 'idle' | 'running' | 'playing' | 'won' | 'lost';

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user, isLoading: authLoading } = useAuth();

  // Level and game state
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor state
  const [code, setCode] = useState('');

  // Execution state
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [executionError, setExecutionError] = useState<string | undefined>();

  // Simulation state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnStates, setTurnStates] = useState<GameState[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  const simulatorRef = useRef<GameSimulator | null>(null);
  const { runCode, terminate } = useCodeRunner();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch level data
  useEffect(() => {
    async function fetchLevel() {
      try {
        const data = await api.getLevel(slug);
        setLevel(data);
        setCode(data.json_data.starterCode);

        // Initialize simulator
        const simulator = new GameSimulator(data.json_data as LevelData);
        simulatorRef.current = simulator;
        setGameState(simulator.createInitialState());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load level');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchLevel();
    }
  }, [slug]);

  // Handle running code
  const handleRun = useCallback(async () => {
    if (!level || !simulatorRef.current) return;

    setPlayState('running');
    setConsoleOutput([]);
    setExecutionError(undefined);

    // Increment attempts
    try {
      await api.incrementAttempts(level.id);
    } catch {
      // Ignore - not critical
    }

    // Run user code in sandbox
    const result = await runCode(code, level.json_data.allowedMethods);

    setConsoleOutput(result.consoleOutput);

    if (result.error) {
      setExecutionError(result.error);
      setPlayState('idle');
      return;
    }

    if (result.actions.length === 0) {
      setExecutionError('No actions were executed. Use hero.move() or hero.wait().');
      setPlayState('idle');
      return;
    }

    // Simulate the actions
    const simResult = simulatorRef.current.simulate(result.actions);
    setTurnStates(simResult.turnStates);
    setCurrentTurnIndex(0);
    setGameState(simResult.turnStates[0]);
    setPlayState('playing');
  }, [level, code, runCode]);

  // Handle animation step completion
  const handleAnimationComplete = useCallback(() => {
    setCurrentTurnIndex((prev) => {
      const next = prev + 1;
      if (next < turnStates.length) {
        setGameState(turnStates[next]);
        return next;
      } else {
        // Animation complete - check final state
        const finalState = turnStates[turnStates.length - 1];
        if (finalState.hasWon) {
          setPlayState('won');
        } else if (!finalState.isAlive) {
          setPlayState('lost');
          setExecutionError('Your hero was destroyed!');
        } else {
          setPlayState('lost');
          setExecutionError('Level not completed. Check win conditions.');
        }
        return prev;
      }
    });
  }, [turnStates]);

  // Handle reset
  const handleReset = useCallback(() => {
    terminate();
    setPlayState('idle');
    setConsoleOutput([]);
    setExecutionError(undefined);
    setTurnStates([]);
    setCurrentTurnIndex(0);

    if (simulatorRef.current) {
      setGameState(simulatorRef.current.createInitialState());
    }
  }, [terminate]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!level || playState !== 'won') return;

    try {
      const finalState = turnStates[turnStates.length - 1];
      await api.submitCompletion(level.id, {
        action_count: finalState.actionHistory.length,
        coins_collected: finalState.collectedCoins.size,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit completion');
    }
  }, [level, playState, turnStates, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel flex items-center justify-center">
        <div className="text-white text-xl">Loading level...</div>
      </div>
    );
  }

  if (error || !level) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'Level not found'}</div>
          <Link href="/dashboard" className="btn bg-game-accent text-white">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const levelData = level.json_data as LevelData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel">
      {/* Navigation */}
      <nav className="border-b border-game-accent bg-game-bg/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <span className="text-lg font-bold text-white">{level.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Level {level.order_index}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-120px)]">
          {/* Left Column - Game Canvas */}
          <div className="flex flex-col">
            <div className="bg-game-panel rounded-xl border border-game-accent p-4 flex-1 flex items-center justify-center">
              {gameState && (
                <GameCanvas
                  levelData={levelData}
                  gameState={gameState}
                  isPlaying={playState === 'playing'}
                  onAnimationComplete={handleAnimationComplete}
                />
              )}
            </div>

            {/* Status Bar */}
            <div className="mt-4 bg-game-panel rounded-lg border border-game-accent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <StatusBadge playState={playState} />
                  {gameState && (
                    <>
                      <span className="text-gray-400 text-sm">
                        Turn: {gameState.currentTurn}
                      </span>
                      <span className="text-gray-400 text-sm">
                        Coins: {gameState.collectedCoins.size}/{levelData.coins.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Instructions, Editor, Console */}
          <div className="flex flex-col gap-4">
            {/* Instructions */}
            <div className="bg-game-panel rounded-xl border border-game-accent p-4">
              <h2 className="text-lg font-semibold text-white mb-2">Instructions</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <div
                  className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: levelData.instructions
                      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-black/50 p-2 rounded text-green-400 overflow-x-auto"><code>$2</code></pre>')
                      .replace(/`([^`]+)`/g, '<code class="bg-black/50 px-1 rounded text-green-400">$1</code>')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>')
                      .replace(/^# (.+)$/gm, '<h3 class="text-lg font-bold text-game-highlight mt-2 mb-1">$1</h3>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-[300px]">
              <CodeEditor
                code={code}
                onChange={setCode}
                isReadOnly={playState === 'running' || playState === 'playing'}
                allowedMethods={levelData.allowedMethods}
              />
            </div>

            {/* Console */}
            <div className="h-32">
              <Console output={consoleOutput} error={executionError} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRun}
                disabled={playState === 'running' || playState === 'playing'}
                className="flex-1 btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 py-3"
              >
                {playState === 'running' ? 'Running...' : playState === 'playing' ? 'Playing...' : 'Run'}
              </button>
              <button
                onClick={handleReset}
                className="btn bg-gray-600 text-white hover:bg-gray-700 py-3 px-6"
              >
                Reset
              </button>
              {playState === 'won' && (
                <button
                  onClick={handleSubmit}
                  className="btn bg-game-highlight text-white hover:bg-game-highlight/80 py-3 px-6"
                >
                  Submit & Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ playState }: { playState: PlayState }) {
  const config = {
    idle: { bg: 'bg-gray-600', text: 'Ready' },
    running: { bg: 'bg-yellow-600', text: 'Compiling...' },
    playing: { bg: 'bg-blue-600', text: 'Running' },
    won: { bg: 'bg-green-600', text: 'Success!' },
    lost: { bg: 'bg-red-600', text: 'Failed' },
  };

  const { bg, text } = config[playState];

  return (
    <span className={`${bg} text-white text-sm font-medium px-3 py-1 rounded-full`}>
      {text}
    </span>
  );
}
