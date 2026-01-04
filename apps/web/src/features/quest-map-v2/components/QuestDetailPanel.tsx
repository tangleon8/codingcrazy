'use client';

import { useRouter } from 'next/navigation';
import { QuestWithStatus } from '../hooks/useQuestProgress';

interface QuestDetailPanelProps {
  quest: QuestWithStatus | null;
  onComplete: (questId: number, stars: number) => void;
  onSetStars: (questId: number, stars: number) => void;
}

export default function QuestDetailPanel({
  quest,
  onComplete,
  onSetStars,
}: QuestDetailPanelProps) {
  const router = useRouter();

  if (!quest) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Quest</h3>
        <p className="text-sm text-gray-500">
          Click on any quest node on the map to see its details
        </p>
      </div>
    );
  }

  const { status, starsEarned, difficulty } = quest;

  const difficultyColors: Record<string, { bg: string; text: string }> = {
    easy: { bg: '#16A34A', text: '#DCFCE7' },
    medium: { bg: '#CA8A04', text: '#FEF9C3' },
    hard: { bg: '#DC2626', text: '#FEE2E2' },
  };

  const diffColor = difficultyColors[difficulty] || difficultyColors.easy;

  const handleStart = () => {
    router.push(`/play/${quest.slug}`);
  };

  const handleMockComplete = () => {
    onComplete(quest.id, 1);
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-2 py-0.5 rounded text-xs font-bold uppercase"
            style={{ backgroundColor: diffColor.bg, color: diffColor.text }}
          >
            {difficulty}
          </span>
          <span className="text-xs text-gray-400">Quest #{quest.id}</span>
        </div>
        <h2 className="text-xl font-bold text-white">{quest.title}</h2>
      </div>

      {/* Status indicator */}
      <div
        className="rounded-lg p-3 mb-4"
        style={{
          background:
            status === 'completed'
              ? 'linear-gradient(180deg, #166534 0%, #14532d 100%)'
              : status === 'unlocked'
                ? 'linear-gradient(180deg, #1E40AF 0%, #1E3A8A 100%)'
                : 'linear-gradient(180deg, #374151 0%, #1F2937 100%)',
          border: `2px solid ${
            status === 'completed' ? '#22C55E' : status === 'unlocked' ? '#3B82F6' : '#4B5563'
          }`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {status === 'completed' && '✅'}
            {status === 'unlocked' && '🔓'}
            {status === 'locked' && '🔒'}
          </span>
          <span className="text-sm font-medium text-white capitalize">{status}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-1">Description</h3>
        <p className="text-sm text-gray-300 leading-relaxed">{quest.description}</p>
      </div>

      {/* Rewards */}
      <div
        className="rounded-lg p-3 mb-4"
        style={{
          background: 'linear-gradient(180deg, #292524 0%, #1C1917 100%)',
          border: '2px solid #D97706',
        }}
      >
        <h3 className="text-xs font-bold text-amber-500 mb-2 uppercase">Rewards</h3>
        <div className="flex items-center justify-around">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <div className="text-purple-400 font-bold">{quest.xpReward}</div>
              <div className="text-purple-300 text-xs">XP</div>
            </div>
          </div>
          <div className="w-px h-8 bg-amber-900" />
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <div>
              <div className="text-yellow-400 font-bold">{quest.coinReward}</div>
              <div className="text-yellow-300 text-xs">Coins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stars (for completed quests) */}
      {status === 'completed' && (
        <div
          className="rounded-lg p-3 mb-4"
          style={{
            background: 'linear-gradient(180deg, #451A03 0%, #27150A 100%)',
            border: '2px solid #F59E0B',
          }}
        >
          <h3 className="text-xs font-bold text-amber-500 mb-2 uppercase">Stars Earned</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3].map((star) => (
              <button
                key={star}
                onClick={() => onSetStars(quest.id, star)}
                className="text-2xl transition-transform hover:scale-110"
                style={{
                  color: star <= starsEarned ? '#F59E0B' : '#4B5563',
                  filter: star <= starsEarned ? 'drop-shadow(0 0 4px #F59E0B)' : 'none',
                }}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-xs text-amber-200/70">Click stars to adjust (for testing)</p>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="space-y-2 mt-4">
        {status === 'unlocked' && (
          <>
            <button
              onClick={handleStart}
              className="w-full py-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
                boxShadow: '0 4px 0 #15803D, 0 6px 12px rgba(0,0,0,0.2)',
                border: '2px solid #4ADE80',
              }}
            >
              ▶ Start Quest
            </button>
            <button
              onClick={handleMockComplete}
              className="w-full py-2 rounded-lg font-medium text-gray-300 transition-all hover:bg-gray-700"
              style={{
                background: '#374151',
                border: '1px solid #4B5563',
              }}
            >
              ✓ Mock Complete (Dev)
            </button>
          </>
        )}

        {status === 'completed' && (
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 4px 0 #1D4ED8, 0 6px 12px rgba(0,0,0,0.2)',
              border: '2px solid #60A5FA',
            }}
          >
            ↻ Replay Quest
          </button>
        )}

        {status === 'locked' && (
          <div
            className="w-full py-3 rounded-lg text-center font-bold"
            style={{
              background: '#374151',
              color: '#6B7280',
            }}
          >
            🔒 Quest Locked
          </div>
        )}
      </div>

      {/* Unlock hint for locked quests */}
      {status === 'locked' && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Complete the previous quest to unlock this one
        </p>
      )}
    </div>
  );
}
