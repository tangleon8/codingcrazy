'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProgression } from '@/lib/progression-context';
import { useQuestProgress } from '@/features/quest-map-v2/hooks/useQuestProgress';
import {
  QuestMapLevel1,
  QuestMapLevel2,
  QuestDetailPanel,
  PlayerHUDSimple,
} from '@/features/quest-map-v2/components';

export default function QuestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { refreshProgression } = useProgression();

  // Level state
  const [currentLevel, setCurrentLevel] = useState<1 | 2>(1);

  // Use separate progress hooks for each level
  const level1Progress = useQuestProgress(1);
  const level2Progress = useQuestProgress(2);

  // Select active progress based on current level
  const activeProgress = currentLevel === 1 ? level1Progress : level2Progress;
  const {
    quests,
    isLoaded,
    totalStars,
    maxStars,
    currentQuest,
    completeQuest,
    setStars,
    resetProgress,
  } = activeProgress;

  const isLevel1Complete = level1Progress.isLevel1Complete;

  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Select first unlocked quest when level changes or on load
  useEffect(() => {
    if (isLoaded && currentQuest) {
      setSelectedQuestId(currentQuest.id);
    }
  }, [isLoaded, currentQuest, currentLevel]);

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
      setSelectedQuestId(currentLevel === 1 ? 1 : 11);
    }
  };

  const handleLevelChange = (level: 1 | 2) => {
    if (level === 2 && !isLevel1Complete) {
      return; // Can't switch to level 2 if level 1 isn't complete
    }
    setCurrentLevel(level);
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

      {/* Level Tabs */}
      <div className="flex justify-center py-3 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex gap-2">
          {/* Level 1 Tab */}
          <button
            onClick={() => handleLevelChange(1)}
            className={`relative px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
              currentLevel === 1
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🌲</span>
              <span>Level 1: High Forest</span>
              {level1Progress.completedCount === level1Progress.totalCount && (
                <span className="text-yellow-300">✓</span>
              )}
            </span>
          </button>

          {/* Level 2 Tab */}
          <button
            onClick={() => handleLevelChange(2)}
            disabled={!isLevel1Complete}
            className={`relative px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
              currentLevel === 2
                ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                : isLevel1Complete
                  ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>💎</span>
              <span>Level 2: Crystal Cave</span>
              {!isLevel1Complete && (
                <span className="text-gray-500">🔒</span>
              )}
              {isLevel1Complete && level2Progress.completedCount === level2Progress.totalCount && (
                <span className="text-yellow-300">✓</span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content: Map + Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Quest Map (takes ~75% width) */}
        <div className="flex-1 p-4">
          {currentLevel === 1 ? (
            <QuestMapLevel1
              quests={quests}
              selectedQuestId={selectedQuestId}
              currentQuest={currentQuest}
              onSelectQuest={setSelectedQuestId}
            />
          ) : (
            <QuestMapLevel2
              quests={quests}
              selectedQuestId={selectedQuestId}
              currentQuest={currentQuest}
              onSelectQuest={setSelectedQuestId}
            />
          )}
        </div>

        {/* Right Panel (fixed ~300px width) */}
        <div
          className="w-80 flex-shrink-0 border-l border-gray-700"
          style={{
            background: currentLevel === 1
              ? 'linear-gradient(180deg, #1F2937 0%, #111827 100%)'
              : 'linear-gradient(180deg, #1e1b4b 0%, #0f0a2e 100%)',
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
