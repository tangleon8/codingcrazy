'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api, UserProgressSummary } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [progress, setProgress] = useState<UserProgressSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProgress() {
      if (!user) return;

      try {
        const data = await api.getProgress();
        setProgress(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchProgress();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const completedCount = progress.filter((p) => p.is_completed).length;
  const totalCount = progress.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel">
      {/* Navigation */}
      <nav className="border-b border-game-accent bg-game-bg/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">
                Coding<span className="text-game-highlight">Crazy</span>
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <span className="text-gray-400">{user.email}</span>
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Summary */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Your Journey</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-game-accent/30 rounded-full h-4 overflow-hidden">
              <div
                className="bg-game-highlight h-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-gray-300 font-medium">
              {completedCount} / {totalCount} levels completed
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-game-panel rounded-xl border border-game-accent p-6 animate-pulse"
              >
                <div className="h-6 bg-game-accent/50 rounded w-3/4 mb-4" />
                <div className="h-4 bg-game-accent/30 rounded w-full mb-2" />
                <div className="h-4 bg-game-accent/30 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          /* Level Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progress.map((level) => (
              <LevelCard key={level.level_id} level={level} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LevelCard({ level }: { level: UserProgressSummary }) {
  const isLocked = !level.is_unlocked;
  const isCompleted = level.is_completed;

  return (
    <div
      className={`
        bg-game-panel rounded-xl border-2 p-6 transition-all duration-200
        ${
          isLocked
            ? 'border-gray-700 opacity-60'
            : isCompleted
            ? 'border-green-500 hover:border-green-400'
            : 'border-game-accent hover:border-game-highlight'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-500">
            #{level.order_index}
          </span>
          <h3 className="text-xl font-semibold text-white">{level.level_title}</h3>
        </div>
        {isCompleted && (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
        {isLocked && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
        <span>Attempts: {level.attempts}</span>
        {isCompleted && <span className="text-green-400">Completed!</span>}
      </div>

      {/* Action Button */}
      {isLocked ? (
        <div className="text-gray-500 text-center py-2">
          Complete previous level to unlock
        </div>
      ) : (
        <Link
          href={`/play/${level.level_slug}`}
          className={`
            block w-full text-center py-3 rounded-lg font-medium transition-colors
            ${
              isCompleted
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-game-highlight text-white hover:bg-game-highlight/80'
            }
          `}
        >
          {isCompleted ? 'Play Again' : 'Start Level'}
        </Link>
      )}
    </div>
  );
}
