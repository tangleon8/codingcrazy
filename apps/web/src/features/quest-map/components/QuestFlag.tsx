'use client';

import { QuestMapItem } from '@/lib/api';

interface QuestFlagProps {
  quest: QuestMapItem;
  isSelected: boolean;
  onClick: () => void;
}

export default function QuestFlag({ quest, isSelected, onClick }: QuestFlagProps) {
  const { quest: q, status, stars_earned } = quest;

  // Colors based on status
  const colors = {
    locked: {
      flag: '#6B7280',
      flagLight: '#9CA3AF',
      pole: '#4B5563',
      base: '#374151',
      glow: 'transparent',
    },
    unlocked: {
      flag: '#2563EB',
      flagLight: '#3B82F6',
      pole: '#60A5FA',
      base: '#1E40AF',
      glow: '#3B82F6',
    },
    completed: {
      flag: '#D97706',
      flagLight: '#F59E0B',
      pole: '#FBBF24',
      base: '#B45309',
      glow: '#F59E0B',
    },
  }[status];

  return (
    <div
      className="absolute cursor-pointer transition-transform duration-150 hover:scale-110"
      style={{
        left: q.node_x - 35,
        top: q.node_y - 75,
        width: 70,
        height: 95,
        zIndex: isSelected ? 15 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Glow effect */}
      {status !== 'locked' && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '70%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            background: `radial-gradient(circle, ${colors.glow}${isSelected ? '50' : '25'} 0%, transparent 70%)`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute rounded-full pointer-events-none animate-ping"
          style={{
            left: '50%',
            top: '65%',
            transform: 'translate(-50%, -50%)',
            width: 60,
            height: 60,
            border: `3px solid ${colors.glow}`,
            opacity: 0.5,
          }}
        />
      )}

      {/* Stars for completed quests */}
      {stars_earned > 0 && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-20">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className="text-sm"
              style={{
                color: star <= stars_earned ? '#F59E0B' : '#374151',
                textShadow: star <= stars_earned ? '0 0 6px #F59E0B' : 'none',
                filter: star <= stars_earned ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Flag SVG */}
      <svg viewBox="0 0 70 90" className="w-full h-full" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}>
        {/* Ground glow */}
        <ellipse
          cx="35"
          cy="82"
          rx="28"
          ry="8"
          fill={colors.glow}
          opacity={status !== 'locked' ? 0.3 : 0}
        />

        {/* Pedestal */}
        <ellipse cx="35" cy="83" rx="22" ry="6" fill="#0d0805" />
        <ellipse cx="35" cy="80" rx="20" ry="5" fill="#2d1810" />
        <ellipse cx="35" cy="77" rx="17" ry="4" fill={colors.base} />

        {/* Pole */}
        <rect x="32" y="20" width="6" height="58" rx="2" fill={colors.pole} />
        <rect x="32" y="20" width="3" height="58" rx="1" fill="white" opacity="0.15" />

        {/* Flag */}
        <path
          d={`M 38 18
              C 55 22, 58 26, 56 32
              C 54 38, 50 42, 38 45
              L 38 18`}
          fill={colors.flag}
        />
        <path
          d={`M 38 20
              C 50 23, 52 27, 51 31
              C 50 35, 47 38, 38 40
              L 38 20`}
          fill={colors.flagLight}
          opacity="0.4"
        />

        {/* Flag icon */}
        {status === 'locked' && (
          <text x="46" y="33" fontSize="12" textAnchor="middle" fill="#9CA3AF">
            🔒
          </text>
        )}
        {status === 'unlocked' && (
          <text x="46" y="34" fontSize="11" textAnchor="middle" fill="white">
            ⚔️
          </text>
        )}
        {status === 'completed' && (
          <text x="46" y="34" fontSize="14" textAnchor="middle" fill="white" fontWeight="bold">
            ✓
          </text>
        )}

        {/* Pole ornament */}
        <circle cx="35" cy="17" r="5" fill={colors.flag} />
        <circle cx="35" cy="17" r="3" fill={colors.flagLight} opacity="0.5" />
      </svg>

      {/* Quest title */}
      <div
        className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
        style={{ width: 100 }}
      >
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded inline-block whitespace-nowrap"
          style={{
            color: status === 'locked' ? '#9CA3AF' : status === 'completed' ? '#FCD34D' : '#93C5FD',
            backgroundColor: 'rgba(0,0,0,0.6)',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {q.title.length > 12 ? q.title.substring(0, 12) + '…' : q.title}
        </span>
      </div>
    </div>
  );
}
