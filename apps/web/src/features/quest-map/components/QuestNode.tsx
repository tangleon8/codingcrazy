'use client';

import { QuestMapItem } from '@/lib/api';

interface QuestNodeProps {
  quest: QuestMapItem;
  isSelected: boolean;
  onClick: () => void;
}

export default function QuestNode({ quest, isSelected, onClick }: QuestNodeProps) {
  const { quest: q, status, stars_earned } = quest;

  // Colors based on status
  const colors = {
    locked: { fill: '#374151', stroke: '#4B5563', glow: 'none' },
    unlocked: { fill: '#0f3460', stroke: '#e94560', glow: '#e94560' },
    completed: { fill: '#065f46', stroke: '#10b981', glow: '#10b981' },
  };

  const color = colors[status];
  const nodeRadius = 35;

  // Difficulty icons
  const difficultyIcon =
    q.difficulty === 'easy'
      ? '1'
      : q.difficulty === 'medium'
      ? '2'
      : q.difficulty === 'hard'
      ? '3'
      : '4';

  return (
    <g
      transform={`translate(${q.node_x}, ${q.node_y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
      style={{ pointerEvents: 'all' }}
    >
      {/* Glow effect for unlocked/completed */}
      {status !== 'locked' && (
        <circle
          r={nodeRadius + 8}
          fill="none"
          stroke={color.glow}
          strokeWidth="3"
          opacity="0.4"
        >
          <animate
            attributeName="opacity"
            values="0.2;0.5;0.2"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle
          r={nodeRadius + 12}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="4"
        />
      )}

      {/* Main node circle */}
      <circle
        r={nodeRadius}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="3"
      />

      {/* Lock icon for locked quests */}
      {status === 'locked' && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="#9CA3AF"
          fontSize="20"
        >
          {'\u{1F512}'}
        </text>
      )}

      {/* Difficulty indicator for unlocked/completed */}
      {status !== 'locked' && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="18"
          fontWeight="bold"
        >
          {difficultyIcon}
        </text>
      )}

      {/* Stars display */}
      {stars_earned > 0 && (
        <g transform="translate(0, 45)">
          {[1, 2, 3].map((star) => (
            <text
              key={star}
              x={(star - 2) * 15}
              textAnchor="middle"
              fontSize="14"
              fill={star <= stars_earned ? '#fbbf24' : '#4B5563'}
            >
              {'\u2605'}
            </text>
          ))}
        </g>
      )}

      {/* Quest title below node */}
      <text
        y={stars_earned > 0 ? 65 : 55}
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontWeight="500"
      >
        {q.title.length > 15 ? q.title.substring(0, 15) + '...' : q.title}
      </text>
    </g>
  );
}
