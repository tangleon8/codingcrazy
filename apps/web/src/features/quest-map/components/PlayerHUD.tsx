'use client';

import { useState } from 'react';
import { useProgression } from '@/lib/progression-context';
import CharacterSelector from './CharacterSelector';

export default function PlayerHUD() {
  const { progression, selectedCharacter, isLoading } = useProgression();
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);

  if (isLoading || !progression) {
    return (
      <div className="bg-gradient-to-r from-amber-900/90 to-amber-800/90 backdrop-blur-sm border-b-2 border-amber-600 px-6 py-2">
        <div className="max-w-7xl mx-auto h-12 flex items-center">
          <div className="text-amber-200">Loading...</div>
        </div>
      </div>
    );
  }

  const xpPercent = (progression.current_xp / progression.xp_to_next_level) * 100;

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
      <div className="bg-gradient-to-r from-amber-900/95 to-stone-900/95 backdrop-blur-sm border-b-2 border-amber-700 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Character & Level */}
          <div className="flex items-center gap-3">
            {/* Character Avatar */}
            <button
              onClick={() => setShowCharacterSelector(true)}
              className="relative group"
              title="Change Character"
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-to-b from-stone-700 to-stone-800 border-2 border-amber-600 flex items-center justify-center shadow-lg group-hover:border-amber-400 transition-colors">
                <span className="text-3xl">
                  {selectedCharacter
                    ? characterEmoji[selectedCharacter.sprite_key] || '👤'
                    : '👤'}
                </span>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-amber-500 to-amber-700 rounded-full w-6 h-6 flex items-center justify-center border border-amber-400 text-xs font-bold text-white shadow">
                {progression.player_level}
              </div>
            </button>

            {/* Level & XP */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-200 font-bold">
                  {selectedCharacter?.display_name || 'Adventurer'}
                </span>
              </div>

              {/* XP Bar */}
              <div className="flex items-center gap-2">
                <div className="w-32 h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-600">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-xs text-purple-300">
                  {progression.current_xp}/{progression.xp_to_next_level} XP
                </span>
              </div>
            </div>
          </div>

          {/* Right: Coins */}
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1 bg-gradient-to-b from-stone-700 to-stone-800 px-3 py-1.5 rounded-lg border border-amber-700">
              <span className="text-xl">🪙</span>
              <span className="text-yellow-300 font-bold text-lg">
                {progression.coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showCharacterSelector && (
        <CharacterSelector onClose={() => setShowCharacterSelector(false)} />
      )}
    </>
  );
}
