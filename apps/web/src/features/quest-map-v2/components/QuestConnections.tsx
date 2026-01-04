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
    <>
      <defs>
        {/* Trail dirt texture pattern */}
        <pattern id="trail-texture" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#5D4E37" />
          <circle cx="2" cy="2" r="0.8" fill="#4A3F2F" opacity="0.6" />
          <circle cx="6" cy="5" r="0.6" fill="#6B5B45" opacity="0.4" />
          <circle cx="4" cy="7" r="0.5" fill="#4A3F2F" opacity="0.5" />
          <circle cx="7" cy="1" r="0.4" fill="#3D3426" opacity="0.4" />
        </pattern>

        {/* Golden glow filter for completed paths */}
        <filter id="trail-glow-gold" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor="#F59E0B" floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft shadow for paths */}
        <filter id="trail-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dx="0.3" dy="0.5" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map(([fromId, toId], idx) => {
        const from = questMap.get(fromId);
        const to = questMap.get(toId);
        if (!from || !to) return null;

        // Check path status
        const isCompleted = from.status === 'completed';
        const isActive = from.status === 'completed' && to.status === 'unlocked';
        const isLocked = from.status !== 'completed';

        // Convert percentages to viewBox coordinates (0-100)
        const x1 = from.x;
        const y1 = from.y;
        const x2 = to.x;
        const y2 = to.y;

        // Calculate curve control point for organic path
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.25;
        const cx = midX + (dy > 0 ? curve : -curve) * Math.sign(dx || 1);

        const pathD = `M ${x1} ${y1} Q ${cx} ${midY} ${x2} ${y2}`;

        return (
          <g key={idx}>
            {/* Layer 1: Trail shadow/depth */}
            <path
              d={pathD}
              fill="none"
              stroke="#2D2416"
              strokeWidth={isCompleted ? '3' : '2.5'}
              strokeLinecap="round"
              opacity={isCompleted ? 0.5 : 0.3}
              vectorEffect="non-scaling-stroke"
            />

            {/* Layer 2: Main dirt trail */}
            <path
              d={pathD}
              fill="none"
              stroke={isCompleted ? '#6B5B45' : '#4B4B4B'}
              strokeWidth={isCompleted ? '2.2' : '1.8'}
              strokeLinecap="round"
              opacity={isCompleted ? 0.9 : 0.5}
              vectorEffect="non-scaling-stroke"
              filter="url(#trail-shadow)"
            />

            {/* Layer 3: Trail texture overlay (completed only) */}
            {isCompleted && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#trail-texture)"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.7"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Layer 4: Trail highlight (top edge) */}
            <path
              d={pathD}
              fill="none"
              stroke={isCompleted ? '#8B7355' : '#5A5A5A'}
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeDasharray={isLocked ? '3 5' : 'none'}
              opacity={isCompleted ? 0.6 : 0.3}
              vectorEffect="non-scaling-stroke"
              style={{
                transform: 'translateY(-0.2px)',
              }}
            />

            {/* Layer 5: Golden glow for completed paths */}
            {isCompleted && (
              <path
                d={pathD}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.35"
                filter="url(#trail-glow-gold)"
                vectorEffect="non-scaling-stroke"
                style={{
                  animation: 'trailGlow 3s ease-in-out infinite',
                }}
              />
            )}

            {/* Stepping stones for locked paths */}
            {isLocked && (
              <>
                {[0.2, 0.4, 0.6, 0.8].map((t, i) => {
                  // Calculate point along quadratic bezier curve
                  const pt = 1 - t;
                  const px = pt * pt * x1 + 2 * pt * t * cx + t * t * x2;
                  const py = pt * pt * y1 + 2 * pt * t * midY + t * t * y2;
                  return (
                    <ellipse
                      key={i}
                      cx={px}
                      cy={py}
                      rx="0.8"
                      ry="0.5"
                      fill="#5A5A5A"
                      opacity="0.4"
                    />
                  );
                })}
              </>
            )}

            {/* Active indicator - animated orb traveling along path */}
            {isActive && (
              <>
                {/* Glow trail */}
                <circle r="1.5" fill="#3B82F6" opacity="0.3">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
                {/* Main orb */}
                <circle r="1" fill="#60A5FA">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
                {/* Inner bright core */}
                <circle r="0.5" fill="#FFFFFF">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
              </>
            )}
          </g>
        );
      })}
    </>
  );
}
