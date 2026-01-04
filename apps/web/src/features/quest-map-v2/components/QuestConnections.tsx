'use client';

import { QuestWithStatus } from '../hooks/useQuestProgress';
import { getQuestConnections } from '../data/level1Quests';

interface QuestConnectionsProps {
  quests: QuestWithStatus[];
}

export default function QuestConnections({ quests }: QuestConnectionsProps) {
  const connections = getQuestConnections();
  const questMap = new Map(quests.map(q => [q.id, q]));

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="path-glow-v2">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map(([fromId, toId], idx) => {
        const from = questMap.get(fromId);
        const to = questMap.get(toId);
        if (!from || !to) return null;

        // Check if the path is completed (from quest is completed)
        const isCompleted = from.status === 'completed';
        const isActive = from.status === 'completed' && to.status === 'unlocked';

        // Convert percentages to viewBox coordinates (0-100)
        const x1 = from.x;
        const y1 = from.y;
        const x2 = to.x;
        const y2 = to.y;

        // Calculate curve control point
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.2;
        const cx = midX + (dy > 0 ? curve : -curve) * Math.sign(dx || 1);

        return (
          <g key={idx}>
            {/* Glow for completed paths */}
            {isCompleted && (
              <path
                d={`M ${x1} ${y1} Q ${cx} ${midY} ${x2} ${y2}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                opacity="0.4"
                filter="url(#path-glow-v2)"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Main path */}
            <path
              d={`M ${x1} ${y1} Q ${cx} ${midY} ${x2} ${y2}`}
              fill="none"
              stroke={isCompleted ? '#F59E0B' : '#4B5563'}
              strokeWidth={isCompleted ? '0.6' : '0.4'}
              strokeDasharray={isCompleted ? 'none' : '2 2'}
              opacity={isCompleted ? 0.9 : 0.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Active indicator (animated) */}
            {isActive && (
              <circle r="0.8" fill="#3B82F6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M ${x1} ${y1} Q ${cx} ${midY} ${x2} ${y2}`}
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
