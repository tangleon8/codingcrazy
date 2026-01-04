'use client';

import { QuestMapItem } from '@/lib/api';

interface QuestMarkerProps {
  quest: QuestMapItem;
  isSelected: boolean;
  onClick: () => void;
}

export default function QuestMarker({ quest, isSelected, onClick }: QuestMarkerProps) {
  const { quest: q, status, stars_earned } = quest;

  // Status-based styling
  const statusConfig = {
    locked: {
      bannerColor: '#4B5563',
      bannerLight: '#6B7280',
      frameColor: '#374151',
      glowColor: 'transparent',
      icon: '🔒',
    },
    unlocked: {
      bannerColor: '#1E40AF',
      bannerLight: '#3B82F6',
      frameColor: '#60A5FA',
      glowColor: '#3B82F6',
      icon: '⚔️',
    },
    completed: {
      bannerColor: '#B45309',
      bannerLight: '#F59E0B',
      frameColor: '#FBBF24',
      glowColor: '#F59E0B',
      icon: '✓',
    },
  }[status];

  // Character portraits for different quest types
  const getQuestPortrait = () => {
    const difficulty = q.difficulty;
    if (status === 'locked') return '❓';

    const portraits: Record<string, string> = {
      easy: '🧙',
      medium: '⚔️',
      hard: '🛡️',
      expert: '👑',
    };
    return portraits[difficulty] || '⚔️';
  };

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200"
      style={{
        left: q.node_x - 30,
        top: q.node_y - 70,
        width: 60,
        height: 90,
        zIndex: isSelected ? 20 : 10,
        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Glow effect for active quests */}
      {status !== 'locked' && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 80,
            background: `radial-gradient(circle, ${statusConfig.glowColor}40 0%, transparent 70%)`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Banner SVG */}
      <svg viewBox="0 0 60 90" className="w-full h-full" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' }}>
        {/* Pole */}
        <rect x="27" y="0" width="6" height="75" fill="#8B7355" />
        <rect x="27" y="0" width="2" height="75" fill="#A08060" opacity="0.5" />

        {/* Pole top ornament */}
        <circle cx="30" cy="5" r="6" fill={statusConfig.bannerLight} />
        <circle cx="30" cy="5" r="4" fill={statusConfig.frameColor} />

        {/* Banner flag */}
        <path
          d="M 33 8 L 55 12 L 52 35 L 33 40 Z"
          fill={statusConfig.bannerColor}
        />
        <path
          d="M 33 10 L 50 13 L 48 32 L 33 36 Z"
          fill={statusConfig.bannerLight}
          opacity="0.3"
        />

        {/* Portrait frame */}
        <rect
          x="8"
          y="15"
          width="36"
          height="40"
          rx="4"
          fill={statusConfig.bannerColor}
          stroke={statusConfig.frameColor}
          strokeWidth="3"
        />

        {/* Portrait inner */}
        <rect
          x="12"
          y="19"
          width="28"
          height="32"
          rx="2"
          fill={status === 'locked' ? '#1F2937' : '#2D1B0E'}
        />

        {/* Portrait gradient overlay */}
        <defs>
          <linearGradient id={`portrait-grad-${q.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="black" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect
          x="12"
          y="19"
          width="28"
          height="32"
          rx="2"
          fill={`url(#portrait-grad-${q.id})`}
        />

        {/* Character icon */}
        <text
          x="26"
          y="42"
          fontSize="22"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {getQuestPortrait()}
        </text>

        {/* Bottom banner tail */}
        <path
          d="M 8 55 L 8 70 L 17 62 L 26 70 L 35 62 L 44 70 L 44 55 Z"
          fill={statusConfig.bannerColor}
        />
        <path
          d="M 10 55 L 10 65 L 17 59 L 26 65 L 35 59 L 42 65 L 42 55 Z"
          fill={statusConfig.bannerLight}
          opacity="0.3"
        />

        {/* Pole base */}
        <ellipse cx="30" cy="75" rx="12" ry="4" fill="#3D2817" />
        <ellipse cx="30" cy="73" rx="10" ry="3" fill="#5D4037" />
      </svg>

      {/* Stars for completed quests */}
      {status === 'completed' && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className="text-xs"
              style={{
                color: star <= stars_earned ? '#F59E0B' : '#4B5563',
                textShadow: star <= stars_earned ? '0 0 4px #F59E0B' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce"
          style={{ color: statusConfig.glowColor }}
        >
          ▲
        </div>
      )}
    </div>
  );
}
