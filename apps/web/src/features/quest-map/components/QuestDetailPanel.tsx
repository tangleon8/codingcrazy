'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, QuestDetailResponse } from '@/lib/api';

interface QuestDetailPanelProps {
  questId: number | null;
  onClose: () => void;
}

export default function QuestDetailPanel({
  questId,
  onClose,
}: QuestDetailPanelProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<QuestDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!questId) {
      setDetail(null);
      return;
    }

    setIsLoading(true);
    api
      .getQuestDetail(questId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [questId]);

  if (!questId) {
    return (
      <div className="bg-gray-900/90 rounded-xl border border-gray-700 p-6 h-full flex items-center justify-center">
        <p className="text-gray-400 text-center">
          Select a quest on the map to view details
        </p>
      </div>
    );
  }

  if (isLoading || !detail) {
    return (
      <div className="bg-gray-900/90 rounded-xl border border-gray-700 p-6 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const { quest, status, stars_earned, best_action_count, attempts } = detail;
  const difficultyColors: Record<string, string> = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-orange-400',
    expert: 'text-red-400',
  };

  const handleStart = () => {
    if (detail.level_slug) {
      router.push(`/play/${detail.level_slug}?questId=${questId}`);
    } else {
      // For quests without linked levels, show a message
      alert('This quest does not have a linked level yet.');
    }
  };

  return (
    <div className="bg-gray-900/90 rounded-xl border border-gray-700 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{quest.title}</h2>
          <span
            className={`text-sm font-medium ${
              difficultyColors[quest.difficulty] || 'text-gray-400'
            }`}
          >
            {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-6">{quest.description}</p>

      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3].map((star) => (
          <span
            key={star}
            className={`text-2xl ${
              star <= stars_earned ? 'text-yellow-400' : 'text-gray-600'
            }`}
          >
            {'\u2605'}
          </span>
        ))}
        <span className="text-gray-400 ml-2 text-sm">
          {stars_earned > 0 ? `${stars_earned}/3 stars` : 'Not completed'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-sm">Attempts</div>
          <div className="text-white text-xl font-bold">{attempts}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-sm">Best Run</div>
          <div className="text-white text-xl font-bold">
            {best_action_count ? `${best_action_count} moves` : '--'}
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-2">Rewards</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">{'\u2728'}</span>
            <span className="text-gray-300">{quest.xp_reward} XP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">{'\u{1FA99}'}</span>
            <span className="text-gray-300">{quest.coin_reward} Coins</span>
          </div>
        </div>
      </div>

      {/* Requirements */}
      {status === 'locked' && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 mb-6">
          <h3 className="text-red-400 font-semibold mb-2">Requirements</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            {quest.level_requirement > 1 && (
              <li>Player Level {quest.level_requirement} required</li>
            )}
            {quest.prerequisite_quests.length > 0 && (
              <li>Complete {quest.prerequisite_quests.length} prerequisite quest(s)</li>
            )}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        {status === 'locked' && (
          <div className="text-center text-gray-400 py-4">
            Complete prerequisites to unlock
          </div>
        )}

        {status === 'unlocked' && (
          <button
            onClick={handleStart}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Start Quest
          </button>
        )}

        {status === 'completed' && (
          <button
            onClick={handleStart}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Replay Quest
          </button>
        )}
      </div>
    </div>
  );
}
