'use client';

import { useProgression } from '@/lib/progression-context';

interface PlayerCharacterProps {
  x: number;
  y: number;
}

export default function PlayerCharacter({ x, y }: PlayerCharacterProps) {
  const { selectedCharacter } = useProgression();

  // Character sprite mapping
  const characterSprites: Record<string, { emoji: string; color: string }> = {
    knight: { emoji: '🛡️', color: '#3B82F6' },
    wizard: { emoji: '🧙', color: '#8B5CF6' },
    ninja: { emoji: '🥷', color: '#1F2937' },
    robot: { emoji: '🤖', color: '#6B7280' },
    astronaut: { emoji: '🚀', color: '#06B6D4' },
    dragon: { emoji: '🐉', color: '#22C55E' },
    pirate: { emoji: '🏴‍☠️', color: '#F59E0B' },
    alien: { emoji: '👽', color: '#A855F7' },
  };

  const sprite = selectedCharacter
    ? characterSprites[selectedCharacter.sprite_key] || { emoji: '🧙', color: '#8B5CF6' }
    : { emoji: '🧙', color: '#8B5CF6' };

  return (
    <div
      className="absolute pointer-events-none transition-all duration-500 ease-out"
      style={{
        left: x - 30,
        top: y - 60,
        width: 60,
        height: 70,
        zIndex: 25,
      }}
    >
      {/* Ground shadow */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{
          width: 40,
          height: 12,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Character glow */}
      <div
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 60,
          height: 60,
          background: `radial-gradient(circle, ${sprite.color}40 0%, transparent 70%)`,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* Character sprite */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center"
        style={{
          top: 5,
          width: 50,
          height: 50,
          background: `linear-gradient(180deg, ${sprite.color}CC 0%, ${sprite.color}99 100%)`,
          borderRadius: '50%',
          border: `3px solid ${sprite.color}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.4), 0 0 20px ${sprite.color}60`,
        }}
      >
        <span className="text-2xl" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}>
          {sprite.emoji}
        </span>
      </div>

      {/* Floating indicator */}
      <div
        className="absolute -top-4 left-1/2 transform -translate-x-1/2"
        style={{
          animation: 'bounce 1s ease-in-out infinite',
        }}
      >
        <div
          className="px-2 py-0.5 rounded text-xs font-bold"
          style={{
            background: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
            color: '#7C2D12',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          YOU
        </div>
        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #F59E0B',
          }}
        />
      </div>
    </div>
  );
}
