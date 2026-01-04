'use client';

import { QuestMapItem } from '@/lib/api';

interface QuestFlagProps {
  quest: QuestMapItem;
  isSelected: boolean;
  onClick: () => void;
}

export default function QuestFlag({ quest, isSelected, onClick }: QuestFlagProps) {
  const { quest: q, status, stars_earned } = quest;

  // Flag colors based on status
  const flagColors = {
    locked: { flag: '#6B7280', pole: '#4B5563', glow: 'transparent', base: '#374151' },
    unlocked: { flag: '#3B82F6', pole: '#60A5FA', glow: '#3B82F6', base: '#1E40AF' },
    completed: { flag: '#F59E0B', pole: '#FBBF24', glow: '#F59E0B', base: '#B45309' },
  };

  const colors = flagColors[status];

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200 hover:scale-110"
      style={{
        left: q.node_x - 40,
        top: q.node_y - 90,
        width: 80,
        height: 110,
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Glow effect when selected or hovered */}
      {(isSelected || status !== 'locked') && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 70%, ${colors.glow}${isSelected ? '60' : '30'} 0%, transparent 60%)`,
            animation: status !== 'locked' ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      )}

      {/* Star indicator for completed quests */}
      {stars_earned > 0 && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-10"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
        >
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className="text-base"
              style={{
                color: star <= stars_earned ? '#F59E0B' : '#4B5563',
                textShadow: star <= stars_earned ? '0 0 8px #F59E0b' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* The Flag SVG */}
      <svg
        viewBox="0 0 80 100"
        className="w-full h-full drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
      >
        {/* Ground glow ring */}
        <ellipse
          cx="40"
          cy="88"
          rx="30"
          ry="10"
          fill={colors.glow}
          opacity={status !== 'locked' ? 0.4 : 0}
        >
          <animate
            attributeName="opacity"
            values="0.2;0.5;0.2"
            dur="2s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Pedestal base - 3D effect */}
        <ellipse cx="40" cy="90" rx="25" ry="8" fill="#1a1008" />
        <ellipse cx="40" cy="87" rx="23" ry="7" fill="#2d1810" />
        <ellipse cx="40" cy="84" rx="20" ry="6" fill={colors.base} />
        <ellipse cx="40" cy="82" rx="18" ry="5" fill={colors.flag} opacity="0.3" />

        {/* Pole shadow */}
        <rect x="36" y="25" width="8" height="60" fill="#000" opacity="0.2" rx="2" />

        {/* Pole */}
        <rect x="37" y="22" width="6" height="60" fill={colors.pole} rx="2" />
        <rect x="37" y="22" width="3" height="60" fill="white" opacity="0.15" rx="1" />

        {/* Flag banner */}
        <path
          d={`M 43 22
              L 70 28
              Q 72 35, 70 42
              L 43 48
              Z`}
          fill={colors.flag}
        />
        {/* Flag highlight */}
        <path
          d={`M 43 24
              L 65 29
              Q 66 34, 65 39
              L 43 43
              Z`}
          fill="white"
          opacity="0.2"
        />
        {/* Flag shadow */}
        <path
          d={`M 43 42
              L 70 36
              Q 72 40, 70 42
              L 43 48
              Z`}
          fill="black"
          opacity="0.2"
        />

        {/* Icon on flag based on status */}
        <g transform="translate(52, 35)">
          {status === 'locked' && (
            <text fontSize="14" fill="#9CA3AF" textAnchor="middle" dominantBaseline="middle">
              🔒
            </text>
          )}
          {status === 'unlocked' && (
            <text fontSize="12" fill="white" textAnchor="middle" dominantBaseline="middle">
              ⚔️
            </text>
          )}
          {status === 'completed' && (
            <text fontSize="16" fill="white" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
              ✓
            </text>
          )}
        </g>

        {/* Pole top ornament */}
        <circle cx="40" cy="20" r="6" fill={colors.flag} />
        <circle cx="40" cy="20" r="4" fill="white" opacity="0.3" />
        <circle cx="38" cy="18" r="1.5" fill="white" opacity="0.5" />
      </svg>

      {/* Quest title below */}
      <div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
        style={{ width: 120 }}
      >
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
            status === 'locked'
              ? 'text-gray-400 bg-black/40'
              : status === 'completed'
              ? 'text-yellow-200 bg-yellow-900/60'
              : 'text-blue-200 bg-blue-900/60'
          }`}
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {q.title.length > 14 ? q.title.substring(0, 14) + '...' : q.title}
        </span>
      </div>
    </div>
  );
}
