'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QuestMapItem } from '@/lib/api';
import QuestMarker from './QuestMarker';
import QuestPopup from './QuestPopup';
import PlayerCharacter from './PlayerCharacter';
import Image from 'next/image';

interface QuestMapProps {
  quests: QuestMapItem[];
  connections: [number, number][];
  selectedQuestId: number | null;
  onSelectQuest: (questId: number | null) => void;
}

// Forest decorations positioned around the map
const DECORATIONS = {
  trees: [
    { x: 50, y: 100, type: 'green' },
    { x: 900, y: 80, type: 'dark' },
    { x: 80, y: 400, type: 'golden' },
    { x: 920, y: 450, type: 'red' },
    { x: 30, y: 700, type: 'green' },
    { x: 950, y: 750, type: 'dark' },
    { x: 100, y: 900, type: 'golden' },
    { x: 880, y: 920, type: 'green' },
  ],
  mushrooms: [
    { x: 200, y: 850 },
    { x: 750, y: 300 },
    { x: 450, y: 600 },
  ],
  rocks: [
    { x: 300, y: 150 },
    { x: 700, y: 800 },
    { x: 150, y: 550 },
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

  // Find player's current position
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

  // Tree image mapping
  const treeImages: Record<string, string> = {
    green: '/assets/dungeon/forest/Trees/Green-Tree.png',
    dark: '/assets/dungeon/forest/Trees/Dark-Tree.png',
    golden: '/assets/dungeon/forest/Trees/Golden-Tree.png',
    red: '/assets/dungeon/forest/Trees/Red-Tree.png',
    yellow: '/assets/dungeon/forest/Trees/Yellow-Tree.png',
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #98D8C8 30%, #228B22 60%, #1a472a 100%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Sky background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/dungeon/forest/Background/Background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />

      {/* World Title Banner */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-30">
        <div className="relative">
          <div
            className="px-8 py-2 rounded-md shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #2D5016 0%, #1a3a0c 50%, #0f2506 100%)',
              border: '3px solid #8B7355',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <h1
              className="text-xl font-bold text-center tracking-wider"
              style={{
                color: '#90EE90',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(144,238,144,0.3)',
              }}
            >
              HIGH FOREST
            </h1>
            <div className="text-center text-green-200 text-sm font-medium">
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
        {/* Ground/Grass Base using tileset */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(34, 139, 34, 0.8) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(34, 139, 34, 0.6) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(85, 107, 47, 0.9) 0%, transparent 70%),
              linear-gradient(180deg, #3a5f2c 0%, #2d4a23 50%, #1e351a 100%)
            `,
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
          }}
        />

        {/* Ground texture pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none rounded-3xl overflow-hidden">
          <defs>
            <pattern id="grass-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="transparent" />
              <circle cx="8" cy="8" r="1" fill="#228B22" />
              <circle cx="24" cy="8" r="1.5" fill="#32CD32" />
              <circle cx="16" cy="20" r="1" fill="#228B22" />
              <circle cx="4" cy="28" r="1" fill="#32CD32" />
              <circle cx="28" cy="24" r="1.5" fill="#228B22" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grass-pattern)" />
        </svg>

        {/* Dirt paths connecting quests */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
          <defs>
            <filter id="path-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
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
                {/* Path shadow */}
                <path
                  d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${midY} ${to.quest.node_x} ${to.quest.node_y}`}
                  fill="none"
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                {/* Dirt path */}
                <path
                  d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${midY} ${to.quest.node_x} ${to.quest.node_y}`}
                  fill="none"
                  stroke={isCompleted ? '#8B7355' : '#5D4E37'}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Path highlight for completed */}
                {isCompleted && (
                  <path
                    d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${midY} ${to.quest.node_x} ${to.quest.node_y}`}
                    fill="none"
                    stroke="#DAA520"
                    strokeWidth="4"
                    strokeDasharray="8 12"
                    opacity="0.6"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Trees from tileset */}
        {DECORATIONS.trees.map((tree, i) => (
          <div
            key={`tree-${i}`}
            className="absolute pointer-events-none"
            style={{
              left: tree.x - 60,
              top: tree.y - 100,
              width: 120,
              height: 150,
              zIndex: 3,
            }}
          >
            <Image
              src={treeImages[tree.type]}
              alt="tree"
              width={120}
              height={150}
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.4))',
              }}
            />
          </div>
        ))}

        {/* Mushroom decorations */}
        {DECORATIONS.mushrooms.map((pos, i) => (
          <div
            key={`mushroom-${i}`}
            className="absolute text-3xl pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              zIndex: 3,
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            🍄
          </div>
        ))}

        {/* Rock decorations */}
        {DECORATIONS.rocks.map((pos, i) => (
          <div
            key={`rock-${i}`}
            className="absolute text-2xl pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              zIndex: 3,
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            🪨
          </div>
        ))}

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
          className="w-10 h-10 bg-gradient-to-b from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-green-100 rounded-lg border-2 border-green-500 text-xl font-bold shadow-lg transition-all"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s * 0.85))}
          className="w-10 h-10 bg-gradient-to-b from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-green-100 rounded-lg border-2 border-green-500 text-xl font-bold shadow-lg transition-all"
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
          className="w-10 h-10 bg-gradient-to-b from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-green-100 rounded-lg border-2 border-green-500 text-sm font-bold shadow-lg transition-all"
          title="Center on current quest"
        >
          ⌖
        </button>
      </div>

      {/* Help hint */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-green-200/80 text-xs z-20">
        Drag to pan • Scroll to zoom • Click a marker to play
      </div>
    </div>
  );
}
