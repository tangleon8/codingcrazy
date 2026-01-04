'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QuestMapItem } from '@/lib/api';
import QuestMarker from './QuestMarker';
import QuestPopup from './QuestPopup';
import PlayerCharacter from './PlayerCharacter';

interface QuestMapProps {
  quests: QuestMapItem[];
  connections: [number, number][];
  selectedQuestId: number | null;
  onSelectQuest: (questId: number | null) => void;
}

// Decorative elements for the dungeon
const DECORATIONS = {
  crystals: [
    { x: 80, y: 850, size: 1.2, color: '#22D3EE' },
    { x: 120, y: 870, size: 0.8, color: '#06B6D4' },
    { x: 60, y: 880, size: 1.0, color: '#67E8F9' },
    { x: 900, y: 200, size: 1.1, color: '#A78BFA' },
    { x: 930, y: 230, size: 0.7, color: '#8B5CF6' },
  ],
  torches: [
    { x: 50, y: 150 },
    { x: 950, y: 150 },
    { x: 50, y: 400 },
    { x: 950, y: 400 },
    { x: 50, y: 650 },
    { x: 950, y: 650 },
    { x: 50, y: 900 },
    { x: 950, y: 900 },
  ],
  skulls: [
    { x: 150, y: 920 },
    { x: 820, y: 180 },
    { x: 350, y: 300 },
  ],
  chests: [
    { x: 700, y: 600 },
    { x: 200, y: 400 },
  ],
  rails: [
    { x1: 100, y1: 800, x2: 300, y2: 750 },
    { x1: 600, y1: 400, x2: 800, y2: 350 },
  ],
};

export default function QuestMap({
  quests,
  connections,
  selectedQuestId,
  onSelectQuest,
}: QuestMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.65);
  const [initialized, setInitialized] = useState(false);

  const MAP_WIDTH = 1000;
  const MAP_HEIGHT = 1000;

  // Find player's current position (first unlocked or last completed quest)
  const getPlayerPosition = () => {
    const currentQuest = quests.find(q => q.status === 'unlocked')
      || quests.filter(q => q.status === 'completed').pop()
      || quests[0];
    return currentQuest ? { x: currentQuest.quest.node_x, y: currentQuest.quest.node_y } : { x: 500, y: 500 };
  };

  const playerPosition = getPlayerPosition();

  // Center map on first unlocked quest when component mounts
  useEffect(() => {
    if (containerRef.current && quests.length > 0 && !initialized) {
      const rect = containerRef.current.getBoundingClientRect();
      const firstQuest = quests.find(q => q.status === 'unlocked') || quests[0];

      const centerX = rect.width / 2 - (firstQuest.quest.node_x * scale);
      const centerY = rect.height / 2 - (firstQuest.quest.node_y * scale);

      setOffset({ x: centerX, y: centerY });
      setInitialized(true);
    }
  }, [quests, scale, initialized]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      e.preventDefault();
    }
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(1.5, scale * delta));

    const scaleRatio = newScale / scale;
    setOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * scaleRatio,
      y: mouseY - (mouseY - prev.y) * scaleRatio,
    }));
    setScale(newScale);
  }, [scale]);

  const selectedQuest = quests.find((q) => q.quest.id === selectedQuestId);
  const questMap = new Map(quests.map((q) => [q.quest.id, q]));
  const completedCount = quests.filter((q) => q.status === 'completed').length;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{
        background: '#0a0605',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* World Title Banner */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30">
        <div className="relative">
          <div
            className="px-8 py-2 rounded-md shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #8B0000 0%, #5c0000 50%, #3d0000 100%)',
              border: '3px solid #DAA520',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <h1
              className="text-xl font-bold text-center tracking-wider"
              style={{
                color: '#FFD700',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.3)',
              }}
            >
              KITHGARD DUNGEON
            </h1>
            <div className="text-center text-amber-200 text-sm font-medium">
              {completedCount} / {quests.length}
            </div>
          </div>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-6 bg-gradient-to-r from-amber-800 to-amber-900 rounded-l" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-6 bg-gradient-to-l from-amber-800 to-amber-900 rounded-r" />
        </div>
      </div>

      {/* Map Container */}
      <div
        className="absolute"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
        }}
      >
        {/* Dungeon Background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000">
          <defs>
            {/* Stone texture pattern */}
            <pattern id="stone-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="#1a1410" />
              <rect x="0" y="0" width="24" height="24" fill="#1f1915" stroke="#0d0a08" strokeWidth="1" />
              <rect x="25" y="0" width="24" height="24" fill="#181210" stroke="#0d0a08" strokeWidth="1" />
              <rect x="0" y="25" width="24" height="24" fill="#151010" stroke="#0d0a08" strokeWidth="1" />
              <rect x="25" y="25" width="24" height="24" fill="#1c1612" stroke="#0d0a08" strokeWidth="1" />
            </pattern>

            {/* Ambient light gradients */}
            <radialGradient id="torch-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF6600" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="crystal-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
            </radialGradient>

            {/* Path glow filter */}
            <filter id="path-glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Base stone floor */}
          <rect width="1000" height="1000" fill="url(#stone-pattern)" rx="20" />

          {/* Dark vignette overlay */}
          <rect width="1000" height="1000" fill="url(#vignette)" rx="20" opacity="0.8" />
          <defs>
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
          </defs>

          {/* Cave walls/borders */}
          <path
            d="M 0 200 Q 30 150, 0 100 L 0 0 L 150 0 Q 100 50, 120 100 Q 80 150, 100 200 Z"
            fill="#0d0805"
          />
          <path
            d="M 1000 200 Q 970 150, 1000 100 L 1000 0 L 850 0 Q 900 50, 880 100 Q 920 150, 900 200 Z"
            fill="#0d0805"
          />

          {/* Ground details - rocks */}
          <ellipse cx="150" cy="950" rx="80" ry="30" fill="#1a1410" />
          <ellipse cx="850" cy="80" rx="60" ry="25" fill="#1a1410" />
          <ellipse cx="500" cy="500" rx="100" ry="40" fill="#151010" opacity="0.5" />

          {/* Mine cart rails */}
          {DECORATIONS.rails.map((rail, i) => (
            <g key={`rail-${i}`}>
              <line
                x1={rail.x1}
                y1={rail.y1}
                x2={rail.x2}
                y2={rail.y2}
                stroke="#4a3525"
                strokeWidth="8"
              />
              <line
                x1={rail.x1}
                y1={rail.y1 + 12}
                x2={rail.x2}
                y2={rail.y2 + 12}
                stroke="#4a3525"
                strokeWidth="8"
              />
              {/* Rail ties */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, j) => {
                const x = rail.x1 + (rail.x2 - rail.x1) * t;
                const y = rail.y1 + (rail.y2 - rail.y1) * t;
                return (
                  <rect
                    key={j}
                    x={x - 15}
                    y={y - 2}
                    width="30"
                    height="20"
                    fill="#3d2817"
                    transform={`rotate(${Math.atan2(rail.y2 - rail.y1, rail.x2 - rail.x1) * 180 / Math.PI} ${x} ${y + 6})`}
                  />
                );
              })}
            </g>
          ))}

          {/* Crystals */}
          {DECORATIONS.crystals.map((crystal, i) => (
            <g key={`crystal-${i}`} transform={`translate(${crystal.x}, ${crystal.y}) scale(${crystal.size})`}>
              <circle cx="0" cy="0" r="30" fill={crystal.color} opacity="0.2" />
              <polygon
                points="-8,15 0,-20 8,15"
                fill={crystal.color}
                opacity="0.9"
              />
              <polygon
                points="-12,18 -5,-10 2,18"
                fill={crystal.color}
                opacity="0.7"
              />
              <polygon
                points="3,12 10,-15 17,12"
                fill={crystal.color}
                opacity="0.8"
              />
            </g>
          ))}

          {/* Treasure chests */}
          {DECORATIONS.chests.map((chest, i) => (
            <g key={`chest-${i}`} transform={`translate(${chest.x}, ${chest.y})`}>
              <rect x="-15" y="-10" width="30" height="20" fill="#8B4513" rx="2" />
              <rect x="-15" y="-10" width="30" height="8" fill="#A0522D" rx="2" />
              <rect x="-2" y="-6" width="4" height="8" fill="#FFD700" rx="1" />
              <ellipse cx="0" cy="10" rx="18" ry="4" fill="rgba(0,0,0,0.3)" />
            </g>
          ))}

          {/* Skulls */}
          {DECORATIONS.skulls.map((skull, i) => (
            <text
              key={`skull-${i}`}
              x={skull.x}
              y={skull.y}
              fontSize="24"
              opacity="0.6"
            >
              💀
            </text>
          ))}
        </svg>

        {/* Torch elements (on top of SVG) */}
        {DECORATIONS.torches.map((torch, i) => (
          <div
            key={`torch-${i}`}
            className="absolute text-2xl"
            style={{
              left: torch.x,
              top: torch.y,
              animation: `pulse ${2 + (i * 0.2)}s ease-in-out infinite`,
              filter: 'drop-shadow(0 0 15px #ff6600)',
            }}
          >
            🔥
          </div>
        ))}

        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {connections.map(([fromId, toId], idx) => {
            const from = questMap.get(fromId);
            const to = questMap.get(toId);
            if (!from || !to) return null;

            const isCompleted = from.status === 'completed';

            const midX = (from.quest.node_x + to.quest.node_x) / 2;
            const midY = (from.quest.node_y + to.quest.node_y) / 2;
            const dx = to.quest.node_x - from.quest.node_x;
            const dy = to.quest.node_y - from.quest.node_y;
            const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
            const cx = midX + (dy > 0 ? curve : -curve) * Math.sign(dx || 1);

            return (
              <g key={idx}>
                {isCompleted && (
                  <path
                    d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${midY} ${to.quest.node_x} ${to.quest.node_y}`}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    opacity="0.3"
                    filter="url(#path-glow)"
                  />
                )}
                <path
                  d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${midY} ${to.quest.node_x} ${to.quest.node_y}`}
                  fill="none"
                  stroke={isCompleted ? '#F59E0B' : '#3d2817'}
                  strokeWidth="4"
                  strokeDasharray={isCompleted ? 'none' : '12 8'}
                  opacity={isCompleted ? 0.9 : 0.4}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Quest Markers */}
        {quests.map((item) => (
          <QuestMarker
            key={item.quest.id}
            quest={item}
            isSelected={selectedQuestId === item.quest.id}
            onClick={() => onSelectQuest(item.quest.id)}
          />
        ))}

        {/* Player Character */}
        <PlayerCharacter x={playerPosition.x} y={playerPosition.y} />
      </div>

      {/* Quest Popup */}
      {selectedQuest && (
        <QuestPopup
          quest={selectedQuest}
          position={{
            x: selectedQuest.quest.node_x * scale + offset.x,
            y: selectedQuest.quest.node_y * scale + offset.y,
          }}
          onClose={() => onSelectQuest(null)}
        />
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => setScale(s => Math.min(1.5, s * 1.15))}
          className="w-10 h-10 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-lg border-2 border-amber-500 text-xl font-bold shadow-lg transition-all"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s * 0.85))}
          className="w-10 h-10 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-lg border-2 border-amber-500 text-xl font-bold shadow-lg transition-all"
        >
          −
        </button>
        <button
          onClick={() => {
            if (containerRef.current && quests.length > 0) {
              const rect = containerRef.current.getBoundingClientRect();
              const firstQuest = quests.find(q => q.status === 'unlocked') || quests[0];
              setOffset({
                x: rect.width / 2 - (firstQuest.quest.node_x * scale),
                y: rect.height / 2 - (firstQuest.quest.node_y * scale),
              });
            }
          }}
          className="w-10 h-10 bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-lg border-2 border-amber-500 text-sm font-bold shadow-lg transition-all"
          title="Center on current quest"
        >
          ⌖
        </button>
      </div>

      {/* Help hint */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-amber-200/80 text-xs z-20">
        Drag to pan • Scroll to zoom • Click a marker to play
      </div>
    </div>
  );
}
