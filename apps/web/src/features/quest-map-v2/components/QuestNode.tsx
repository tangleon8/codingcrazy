'use client';

import { QuestWithStatus } from '../hooks/useQuestProgress';

interface QuestNodeProps {
  quest: QuestWithStatus;
  isSelected: boolean;
  onClick: () => void;
  showStartHere?: boolean;
}

// Stone badge styling based on status
const STONE_STYLES = {
  locked: {
    base: 'linear-gradient(145deg, #5A5A5A 0%, #4A4A4A 50%, #3A3A3A 100%)',
    border: '#6B6B6B',
    glow: 'transparent',
    runeColor: '#7A7A7A',
    iconColor: '#9CA3AF',
  },
  unlocked: {
    base: 'linear-gradient(145deg, #3D5A80 0%, #2C4A6E 50%, #1E3A5C 100%)',
    border: '#5B8FBF',
    glow: 'rgba(91, 143, 191, 0.5)',
    runeColor: '#7BB8E8',
    iconColor: '#FFFFFF',
  },
  completed: {
    base: 'linear-gradient(145deg, #6B5344 0%, #5A4234 50%, #4A3224 100%)',
    border: '#D4A76A',
    glow: 'rgba(212, 167, 106, 0.5)',
    runeColor: '#E8C07A',
    iconColor: '#FFFFFF',
  },
};

export default function QuestNode({ quest, isSelected, onClick, showStartHere = false }: QuestNodeProps) {
  const { status, starsEarned, title, id } = quest;
  const style = STONE_STYLES[status];

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${quest.x}%`,
        top: `${quest.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={onClick}
    >
      {/* "Start Here" callout for Quest 1 */}
      {showStartHere && (
        <>
          {/* Pulsing ring */}
          <div
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: 80,
              height: 80,
              border: '3px solid #22C55E',
              borderRadius: '14px',
              animation: 'tutorialPulse 2s ease-out infinite',
            }}
          />

          {/* Bouncing "Start Here" label */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '-55px',
              transform: 'translateX(-50%)',
              animation: 'tutorialBounce 1.5s ease-in-out infinite',
              zIndex: 25,
            }}
          >
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap"
              style={{
                background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.5)',
                border: '2px solid #4ADE80',
              }}
            >
              Start Here!
            </div>
            {/* Arrow pointing down */}
            <div
              className="mx-auto"
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid #16A34A',
              }}
            />
          </div>
        </>
      )}

      {/* Outer glow ring (unlocked/completed only) */}
      {status !== 'locked' && (
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 76,
            height: 76,
            background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
            animation: isSelected ? 'runeGlow 2s ease-in-out infinite' : 'none',
          }}
        />
      )}

      {/* Selection ping effect */}
      {isSelected && (
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 64,
            height: 64,
            border: `2px solid ${style.border}`,
            borderRadius: '14px',
            animation: 'selectionPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      )}

      {/* Stone badge container */}
      <div
        className="relative transition-transform duration-200 group-hover:scale-110"
        style={{
          width: 56,
          height: 56,
          background: style.base,
          borderRadius: '12px',
          border: `3px solid ${style.border}`,
          boxShadow: `
            0 4px 10px rgba(0,0,0,0.5),
            inset 0 2px 4px rgba(255,255,255,0.15),
            inset 0 -3px 6px rgba(0,0,0,0.25)
          `,
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {/* Stone texture overlay */}
        <div
          className="absolute inset-0 rounded-lg opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 40%),
              radial-gradient(circle at 75% 75%, rgba(0,0,0,0.15) 0%, transparent 40%)
            `,
          }}
        />

        {/* Runic corner decorations (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 56 56">
          {/* Corner rune marks */}
          <path
            d="M10 4 L4 10 M46 4 L52 10 M10 52 L4 46 M46 52 L52 46"
            stroke={style.runeColor}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          {/* Inner decorative circle */}
          <circle
            cx="28"
            cy="28"
            r="18"
            fill="none"
            stroke={style.runeColor}
            strokeWidth="1"
            strokeDasharray="3 5"
            opacity="0.35"
          />
        </svg>

        {/* Center SVG icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {status === 'locked' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={style.iconColor}>
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          )}
          {status === 'unlocked' && (
            <svg width="26" height="26" viewBox="0 0 24 24" fill={style.iconColor}>
              <path d="M7.5 4A5.5 5.5 0 0 0 2 9.5V11h2V9.5A3.5 3.5 0 0 1 7.5 6h.5a3.5 3.5 0 0 1 3.5 3.5V11h2V9.5A5.5 5.5 0 0 0 8 4h-.5zM6 12l.001 1.5.002.5L3.5 20h17l-2.503-6-.002-.5V12H6zm8 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              <path d="M16 3l2 2-8 8-4-4 2-2 2 2z" opacity="0.7"/>
            </svg>
          )}
          {status === 'completed' && (
            <svg width="28" height="28" viewBox="0 0 24 24" fill={style.iconColor}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
        </div>

        {/* Quest number badge */}
        <div
          className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
          style={{
            background: status === 'completed'
              ? 'linear-gradient(145deg, #22C55E 0%, #16A34A 100%)'
              : status === 'unlocked'
                ? 'linear-gradient(145deg, #3B82F6 0%, #2563EB 100%)'
                : 'linear-gradient(145deg, #6B7280 0%, #4B5563 100%)',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.5)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {id}
        </div>
      </div>

      {/* Stars for completed quests */}
      {status === 'completed' && starsEarned > 0 && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <svg key={star} width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={star <= starsEarned ? '#FBBF24' : '#4B5563'}
                stroke={star <= starsEarned ? '#F59E0B' : '#374151'}
                strokeWidth="1"
                style={{
                  filter: star <= starsEarned ? 'drop-shadow(0 0 4px #F59E0B)' : 'none',
                }}
              />
            </svg>
          ))}
        </div>
      )}

      {/* Quest title tooltip */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg pointer-events-none transition-opacity duration-200"
        style={{
          top: status === 'completed' && starsEarned > 0 ? 'calc(100% + 28px)' : 'calc(100% + 12px)',
          background: 'linear-gradient(180deg, #2D2D2D 0%, #1A1A1A 100%)',
          border: '1px solid #4A4A4A',
          color: status === 'locked' ? '#9CA3AF' : '#FFFFFF',
          opacity: isSelected ? 1 : 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        {title}
      </div>
    </div>
  );
}
