'use client';

import { useEffect, useState } from 'react';

interface PlayerCharacterProps {
  x: number;
  y: number;
}

export default function PlayerCharacter({ x, y }: PlayerCharacterProps) {
  const [frame, setFrame] = useState(0);

  // Animate the sprite (4 frames in the idle animation)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 200); // Change frame every 200ms

    return () => clearInterval(interval);
  }, []);

  // Sprite sheet is 4 frames wide, each frame is ~64px
  const FRAME_WIDTH = 64;
  const FRAME_HEIGHT = 64;

  return (
    <div
      className="absolute pointer-events-none transition-all duration-500 ease-out"
      style={{
        left: x - 40,
        top: y - 70,
        width: 80,
        height: 90,
        zIndex: 25,
      }}
    >
      {/* Ground shadow */}
      <div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        style={{
          width: 50,
          height: 15,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Character glow ring */}
      <div
        className="absolute left-1/2 bottom-4 transform -translate-x-1/2"
        style={{
          width: 60,
          height: 20,
          background: 'radial-gradient(ellipse, rgba(255,215,0,0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* Character sprite from tileset */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2"
        style={{
          top: 0,
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          backgroundImage: 'url(/assets/dungeon/forest/Character/Idle/Idle-Sheet.png)',
          backgroundPosition: `-${frame * FRAME_WIDTH}px 0`,
          backgroundSize: `${FRAME_WIDTH * 4}px ${FRAME_HEIGHT}px`,
          imageRendering: 'pixelated',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
          transform: 'translateX(-50%) scale(1.2)',
        }}
      />

      {/* Floating "YOU" indicator */}
      <div
        className="absolute -top-6 left-1/2 transform -translate-x-1/2"
        style={{
          animation: 'bounce 1s ease-in-out infinite',
        }}
      >
        <div
          className="px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
          style={{
            background: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
            color: '#7C2D12',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #FCD34D',
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
