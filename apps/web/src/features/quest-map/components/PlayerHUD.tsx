'use client';

import { useState } from 'react';
import { useProgression } from '@/lib/progression-context';
import CharacterSelector from './CharacterSelector';

export default function PlayerHUD() {
  const { progression, selectedCharacter, isLoading } = useProgression();
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);

  if (isLoading || !progression) {
    return (
      <div className="h-16 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-b-2 border-amber-900/50 flex items-center justify-center">
        <div className="text-amber-200/50">Loading...</div>
      </div>
    );
  }

  const xpPercent = Math.min(100, (progression.current_xp / progression.xp_to_next_level) * 100);

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

  return (
    <>
      <div
        className="h-16 px-4 flex items-center justify-between border-b-2"
        style={{
          background: 'linear-gradient(180deg, #292018 0%, #1a1410 50%, #0f0c08 100%)',
          borderColor: '#3d2817',
        }}
      >
        {/* Left: Character & Level */}
        <div className="flex items-center gap-4">
          {/* Character Avatar */}
          <button
            onClick={() => setShowCharacterSelector(true)}
            className="relative group"
            title="Change Character"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(180deg, #3d2817 0%, #2a1a10 100%)',
                border: '2px solid #5a3d25',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <span className="text-2xl">
                {selectedCharacter
                  ? characterEmoji[selectedCharacter.sprite_key] || '👤'
                  : '👤'}
              </span>
            </div>
            {/* Level badge */}
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(180deg, #D97706 0%, #92400E 100%)',
                border: '2px solid #FBBF24',
                color: '#FEF3C7',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {progression.player_level}
            </div>
          </button>

          {/* Name & XP */}
          <div className="flex flex-col gap-1">
            <span className="text-amber-100 font-semibold text-sm">
              {selectedCharacter?.display_name || 'Adventurer'}
            </span>

            {/* XP Bar */}
            <div className="flex items-center gap-2">
              <div
                className="w-28 h-2.5 rounded-full overflow-hidden"
                style={{
                  background: '#1a1410',
                  border: '1px solid #3d2817',
                }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(180deg, #A855F7 0%, #7C3AED 100%)',
                    boxShadow: '0 0 8px #A855F7',
                  }}
                />
              </div>
              <span className="text-purple-300 text-xs font-medium">
                {progression.current_xp}/{progression.xp_to_next_level}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Coins */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, #3d2817 0%, #2a1a10 100%)',
            border: '2px solid #5a3d25',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <span className="text-xl">🪙</span>
          <span className="text-yellow-300 font-bold text-lg">
            {progression.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {showCharacterSelector && (
        <CharacterSelector onClose={() => setShowCharacterSelector(false)} />
      )}
    </>
  );
}
