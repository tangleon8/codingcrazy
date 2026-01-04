'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProgression } from '@/lib/progression-context';
import { useQuestProgress } from '@/features/quest-map-v2/hooks/useQuestProgress';
import {
  QuestMapLevel1,
  QuestDetailPanel,
  PlayerHUDSimple,
} from '@/features/quest-map-v2/components';

export default function QuestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { refreshProgression } = useProgression();

  const {
    quests,
    isLoaded,
    totalStars,
    maxStars,
    currentQuest,
    completeQuest,
    setStars,
    resetProgress,
  } = useQuestProgress();

  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Select first unlocked quest by default
  useEffect(() => {
    if (isLoaded && !selectedQuestId && currentQuest) {
      setSelectedQuestId(currentQuest.id);
    }
  }, [isLoaded, selectedQuestId, currentQuest]);

  const handleCompleteQuest = async (questId: number, stars: number) => {
    completeQuest(questId, stars);
    // Refresh progression to update XP/coins (if backend is connected)
    try {
      await refreshProgression();
    } catch {
      // Ignore if backend fails
    }
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all quest progress? This cannot be undone.')) {
      resetProgress();
      setSelectedQuestId(1); // Reset selection to first quest
    }
  };

  const selectedQuest = quests.find(q => q.id === selectedQuestId) || null;

  if (authLoading || !user || !isLoaded) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
      {/* Top HUD Bar */}
      <PlayerHUDSimple
        totalStars={totalStars}
        maxStars={maxStars}
        onResetProgress={handleResetProgress}
      />

      {/* Main Content: Map + Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Quest Map (takes ~75% width) */}
        <div className="flex-1 p-4">
          <QuestMapLevel1
            quests={quests}
            selectedQuestId={selectedQuestId}
            currentQuest={currentQuest}
            onSelectQuest={setSelectedQuestId}
          />
        </div>

        {/* Right Panel (fixed ~300px width) */}
        <div
          className="w-80 flex-shrink-0 border-l border-gray-700"
          style={{
            background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
          }}
        >
          <QuestDetailPanel
            quest={selectedQuest}
            onComplete={handleCompleteQuest}
            onSetStars={setStars}
          />
        </div>
      </div>
    </div>
  );
}
