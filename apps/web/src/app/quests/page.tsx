'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useProgression } from '@/lib/progression-context';
import { api, QuestMapResponse } from '@/lib/api';
import {
  QuestMap,
  PlayerHUD,
} from '@/features/quest-map/components';

export default function QuestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { refreshProgression } = useProgression();

  const [mapData, setMapData] = useState<QuestMapResponse | null>(null);
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchMap() {
      try {
        const data = await api.getQuestMap();
        setMapData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quest map');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchMap();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleResetProgress = async () => {
    if (
      confirm(
        'Are you sure you want to reset all progress? This cannot be undone.'
      )
    ) {
      try {
        await api.resetProgress();
        await refreshProgression();
        const data = await api.getQuestMap();
        setMapData(data);
        setSelectedQuestId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reset progress');
      }
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0806' }}>
      {/* Navigation */}
      <nav
        className="border-b-2 px-4"
        style={{
          background: 'linear-gradient(180deg, #1a1410 0%, #0f0c08 100%)',
          borderColor: '#3d2817',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-amber-100">
                Coding<span className="text-orange-400">Crazy</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-amber-200/70 hover:text-amber-100 transition-colors text-sm"
              >
                Dashboard
              </Link>
              {user.is_admin && (
                <>
                  <Link
                    href="/admin"
                    className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={handleResetProgress}
                    className="text-red-400 hover:text-red-300 transition-colors text-xs"
                  >
                    Reset
                  </button>
                </>
              )}
              <span className="text-amber-200/50 text-sm">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-amber-200/70 hover:text-amber-100 transition-colors text-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Player HUD */}
      <PlayerHUD />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {error && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-xl">Loading quest map...</div>
          </div>
        ) : mapData ? (
          <div className="flex-1 w-full h-full">
            <QuestMap
              quests={mapData.quests}
              connections={mapData.connections}
              selectedQuestId={selectedQuestId}
              onSelectQuest={setSelectedQuestId}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400">No quest data available</div>
          </div>
        )}
      </main>
    </div>
  );
}
