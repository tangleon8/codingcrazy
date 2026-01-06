'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useProgression } from '@/lib/progression-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { progression } = useProgression();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navigation */}
      <nav className="border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">
                Coding<span className="text-orange-400">Crazy</span>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome back, Adventurer!
          </h1>
          <p className="text-xl text-gray-400">
            Continue your coding journey through the High Forest
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
              border: '2px solid #374151',
            }}
          >
            <div className="text-3xl mb-2">🎮</div>
            <div className="text-2xl font-bold text-purple-400">
              Level {progression?.player_level || 1}
            </div>
            <div className="text-sm text-gray-400">Player Level</div>
          </div>

          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
              border: '2px solid #374151',
            }}
          >
            <div className="text-3xl mb-2">✨</div>
            <div className="text-2xl font-bold text-purple-400">
              {progression?.current_xp || 0}
            </div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>

          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
              border: '2px solid #374151',
            }}
          >
            <div className="text-3xl mb-2">🪙</div>
            <div className="text-2xl font-bold text-yellow-400">
              {progression?.coins || 0}
            </div>
            <div className="text-sm text-gray-400">Coins</div>
          </div>
        </div>

        {/* World Exploration CTA - Main Focus */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
            border: '3px solid #22C55E',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.2)',
          }}
        >
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Explore the World
          </h2>
          <p className="text-green-200 mb-8 max-w-xl mx-auto text-lg">
            Explore zones, fight enemies, interact with NPCs, and master coding through adventure!
          </p>
          <Link
            href="/world"
            className="inline-block px-12 py-4 rounded-xl font-bold text-xl text-white transition-all hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
              boxShadow: '0 4px 0 #15803D, 0 8px 20px rgba(0,0,0,0.3)',
              border: '2px solid #4ADE80',
            }}
          >
            Enter World
          </Link>
        </div>

        {/* Quick Tips */}
        <div className="mt-12 grid grid-cols-2 gap-6">
          <div
            className="rounded-xl p-6"
            style={{
              background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
              border: '1px solid #374151',
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Combat</h3>
            <p className="text-sm text-gray-400">
              Use hero.attack() to fight enemies. Write loops and conditionals to create battle strategies!
            </p>
          </div>

          <div
            className="rounded-xl p-6"
            style={{
              background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
              border: '1px solid #374151',
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Exploration</h3>
            <p className="text-sm text-gray-400">
              Talk to NPCs, open chests, and defeat enemies to earn XP, gold, and items!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
