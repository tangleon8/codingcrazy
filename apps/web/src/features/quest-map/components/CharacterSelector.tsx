'use client';

import { useState } from 'react';
import { useProgression } from '@/lib/progression-context';

interface CharacterSelectorProps {
  onClose: () => void;
}

export default function CharacterSelector({ onClose }: CharacterSelectorProps) {
  const { characters, selectCharacter, purchaseCharacter, progression } =
    useProgression();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (characterId: number, coinCost: number) => {
    setIsProcessing(true);
    setError('');

    try {
      if (coinCost > 0) {
        await purchaseCharacter(characterId);
      } else {
        await selectCharacter(characterId);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select character');
    } finally {
      setIsProcessing(false);
    }
  };

  // Character emoji mapping
  const characterEmoji: Record<string, string> = {
    knight: '\u{1F6E1}\u{FE0F}',
    wizard: '\u{1F9D9}',
    ninja: '\u{1F977}',
    robot: '\u{1F916}',
    astronaut: '\u{1F680}',
    dragon: '\u{1F409}',
    pirate: '\u{1F3F4}\u200D\u2620\u{FE0F}',
    alien: '\u{1F47D}',
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Select Character</h2>
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

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {characters.map((char) => {
            const canAfford =
              char.coin_cost === 0 ||
              (progression && progression.coins >= char.coin_cost);
            const isClickable = char.is_unlocked || (canAfford && !char.is_selected);

            return (
              <button
                key={char.id}
                onClick={() =>
                  isClickable && handleSelect(char.id, char.coin_cost)
                }
                disabled={!isClickable || isProcessing}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left
                  ${
                    char.is_selected
                      ? 'border-pink-500 bg-pink-500/20'
                      : char.is_unlocked
                      ? 'border-gray-600 hover:border-pink-500 bg-gray-800/50'
                      : canAfford && char.coin_cost > 0
                      ? 'border-yellow-600 hover:border-yellow-500 bg-yellow-900/20'
                      : 'border-gray-700 bg-gray-800/30 opacity-60'
                  }
                `}
              >
                <div className="text-4xl mb-2 text-center">
                  {characterEmoji[char.sprite_key] || '\u{1F464}'}
                </div>
                <div className="text-white font-medium text-sm text-center">
                  {char.display_name}
                </div>

                {char.is_selected && (
                  <div className="text-xs text-pink-400 mt-1 text-center">
                    Selected
                  </div>
                )}

                {!char.is_unlocked && !char.is_selected && (
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    {char.coin_cost > 0 && canAfford ? (
                      <span className="text-yellow-400">
                        {'\u{1FA99}'} {char.coin_cost}
                      </span>
                    ) : (
                      char.unlock_reason
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {characters.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No characters available yet.
          </div>
        )}
      </div>
    </div>
  );
}
