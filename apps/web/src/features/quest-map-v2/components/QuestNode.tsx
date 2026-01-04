'use client';

import { QuestWithStatus } from '../hooks/useQuestProgress';

interface QuestNodeProps {
  quest: QuestWithStatus;
  isSelected: boolean;
  onClick: () => void;
}

export default function QuestNode({ quest, isSelected, onClick }: QuestNodeProps) {
  const { status, starsEarned, title } = quest;

  // Status-based colors
  const colors = {
    locked: {
      bg: '#4B5563',
      border: '#374151',
      glow: 'transparent',
      icon: '#9CA3AF',
    },
    unlocked: {
      bg: '#1E40AF',
      border: '#3B82F6',
      glow: '#3B82F680',
      icon: '#FFFFFF',
    },
    completed: {
      bg: '#B45309',
      border: '#F59E0B',
      glow: '#F59E0B80',
      icon: '#FFFFFF',
    },
  }[status];

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200"
      style={{
        left: `${quest.x}%`,
        top: `${quest.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={onClick}
    >
      {/* Glow effect */}
      {status !== 'locked' && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 70,
            height: 70,
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            animation: isSelected ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 60,
            height: 60,
            borderColor: colors.border,
            animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      )}

      {/* Main node circle */}
      <div
        className="relative rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110"
        style={{
          width: 48,
          height: 48,
          background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.bg}CC 100%)`,
          border: `3px solid ${colors.border}`,
          boxShadow: `0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)`,
        }}
      >
        {/* Icon */}
        <span className="text-xl" style={{ color: colors.icon }}>
          {status === 'locked' && '🔒'}
          {status === 'unlocked' && '⚔️'}
          {status === 'completed' && '✓'}
        </span>
      </div>

      {/* Stars for completed quests */}
      {status === 'completed' && starsEarned > 0 && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className="text-xs"
              style={{
                color: star <= starsEarned ? '#F59E0B' : '#4B5563',
                textShadow: star <= starsEarned ? '0 0 4px #F59E0B' : 'none',
              }}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Quest number badge */}
      <div
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          background: status === 'completed' ? '#22C55E' : status === 'unlocked' ? '#3B82F6' : '#6B7280',
          color: 'white',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {quest.id}
      </div>

      {/* Quest title tooltip */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-1 rounded pointer-events-none"
        style={{
          top: 'calc(100% + 20px)',
          background: 'rgba(0,0,0,0.8)',
          color: status === 'locked' ? '#9CA3AF' : '#FFFFFF',
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        {title}
      </div>
    </div>
  );
}
