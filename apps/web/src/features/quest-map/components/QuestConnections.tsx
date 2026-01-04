'use client';

import { QuestMapItem } from '@/lib/api';

interface QuestConnectionsProps {
  connections: [number, number][];
  questMap: Map<number, QuestMapItem>;
}

export default function QuestConnections({
  connections,
  questMap,
}: QuestConnectionsProps) {
  return (
    <g>
      {connections.map(([fromId, toId]) => {
        const from = questMap.get(fromId);
        const to = questMap.get(toId);

        if (!from || !to) return null;

        const x1 = from.quest.node_x;
        const y1 = from.quest.node_y;
        const x2 = to.quest.node_x;
        const y2 = to.quest.node_y;

        // Calculate control points for curved path
        const midY = (y1 + y2) / 2;
        const path = `M ${x1} ${y1} Q ${x1} ${midY}, ${(x1 + x2) / 2} ${midY} T ${x2} ${y2}`;

        // Color based on completion status
        const isCompleted = from.status === 'completed';
        const strokeColor = isCompleted ? '#10b981' : '#4B5563';
        const strokeWidth = isCompleted ? 4 : 2;

        return (
          <path
            key={`${fromId}-${toId}`}
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={isCompleted ? 0.8 : 0.4}
            strokeDasharray={isCompleted ? 'none' : '8 4'}
          />
        );
      })}
    </g>
  );
}
