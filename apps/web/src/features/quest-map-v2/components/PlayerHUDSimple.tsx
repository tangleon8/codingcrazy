'use client';

import { useProgression } from '@/lib/progression-context';
import Link from 'next/link';

interface PlayerHUDSimpleProps {
  totalStars: number;
  maxStars: number;
  onResetProgress: () => void;
}

export default function PlayerHUDSimple({
  totalStars,
  maxStars,
  onResetProgress,
}: PlayerHUDSimpleProps) {
  const { progression, selectedCharacter, isLoading } = useProgression();

  // Character emoji mapping
  const characterEmoji: Record<string, string> = {
    knight: '🛡️',
    wizard: '🧙',
    ninja: '🥷',
    robot: '🤖',
    astronaut: '🚀',
    dragon: '🐉',
    pirate: '🏴‍☠️',
    alien: '👽',
  };

  const xpPercent = progression
    ? Math.min(100, (progression.current_xp / progression.xp_to_next_level) * 100)
    : 0;

  if (isLoading) {
    return (
      <div
        className="h-14 px-4 flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
          borderBottom: '2px solid #374151',
        }}
      >
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="h-14 px-4 flex items-center justify-between"
      style={{
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        borderBottom: '2px solid #374151',
      }}
    >
      {/* Left: Logo + Character */}
      <div className="flex items-center gap-4">
        {/* Logo/Home link */}
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-lg font-bold text-amber-100">
            Coding<span className="text-orange-400">Crazy</span>
          </span>
        </Link>

        <div className="w-px h-8 bg-gray-700" />

        {/* Character avatar */}
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #374151 0%, #1F2937 100%)',
              border: '2px solid #4B5563',
            }}
          >
            <span className="text-xl">
              {selectedCharacter
                ? characterEmoji[selectedCharacter.sprite_key] || '👤'
                : '👤'}
            </span>
          </div>

          {/* Level badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{
                  background: 'linear-gradient(180deg, #D97706 0%, #92400E 100%)',
                  color: '#FEF3C7',
                }}
              >
                LVL {progression?.player_level || 1}
              </span>
              <span className="text-xs text-gray-400">
                {selectedCharacter?.display_name || 'Adventurer'}
              </span>
            </div>

            {/* XP Bar */}
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className="w-20 h-1.5 rounded-full overflow-hidden"
                style={{
                  background: '#1F2937',
                  border: '1px solid #374151',
                }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(90deg, #A855F7 0%, #7C3AED 100%)',
                  }}
                />
              </div>
              <span className="text-[10px] text-purple-300">
                {progression?.current_xp || 0}/{progression?.xp_to_next_level || 100}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Stars */}
      <div className="flex items-center gap-2">
        <span className="text-yellow-400">⭐</span>
        <span className="text-sm font-medium text-yellow-300">
          {totalStars} / {maxStars}
        </span>
      </div>

      {/* Right: Coins + Reset */}
      <div className="flex items-center gap-4">
        {/* Coins */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, #374151 0%, #1F2937 100%)',
            border: '1px solid #4B5563',
          }}
        >
          <span className="text-lg">🪙</span>
          <span className="text-yellow-300 font-bold">
            {progression?.coins?.toLocaleString() || 0}
          </span>
        </div>

        {/* Reset button */}
        <button
          onClick={onResetProgress}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 transition-colors hover:bg-red-900/30"
          style={{
            background: 'rgba(127, 29, 29, 0.3)',
            border: '1px solid #7F1D1D',
          }}
        >
          Reset Progress
        </button>
      </div>
    </div>
  );
}
