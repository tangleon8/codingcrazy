'use client';

import { useState, useRef, useEffect } from 'react';
import { QuestMapItem } from '@/lib/api';
import QuestFlag from './QuestFlag';
import QuestPopup from './QuestPopup';

interface QuestMapProps {
  quests: QuestMapItem[];
  connections: [number, number][];
  selectedQuestId: number | null;
  onSelectQuest: (questId: number | null) => void;
}

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
  const [scale, setScale] = useState(1);

  // Map dimensions (the world size)
  const MAP_WIDTH = 1600;
  const MAP_HEIGHT = 1000;

  // Center the map initially
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOffset({
        x: (rect.width - MAP_WIDTH) / 2,
        y: (rect.height - MAP_HEIGHT) / 2 + 100,
      });
    }
  }, []);

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.5, Math.min(2, s * delta)));
  };

  // Find selected quest
  const selectedQuest = quests.find((q) => q.quest.id === selectedQuestId);

  // Build quest map for connections
  const questMap = new Map(quests.map((q) => [q.quest.id, q]));

  // Count completed quests
  const completedCount = quests.filter((q) => q.status === 'completed').length;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #1a0a0a 0%, #2d1810 30%, #1a1a2e 100%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* World Title Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="relative">
          <div className="bg-gradient-to-b from-red-800 to-red-900 px-8 py-2 rounded-lg border-2 border-yellow-600 shadow-lg">
            <h1 className="text-xl font-bold text-yellow-100 tracking-wide">
              CODE DUNGEON
            </h1>
            <div className="text-center text-yellow-200 text-sm">
              {completedCount}/{quests.length}
            </div>
          </div>
          {/* Banner ribbons */}
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-red-900 rounded-l" />
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-red-900 rounded-r" />
        </div>
      </div>

      {/* Map Container */}
      <div
        className="absolute cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
        }}
      >
        {/* Background decorations - dungeon floor pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.4) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.3) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(100, 50, 20, 0.2) 0%, transparent 60%)
            `,
          }}
        />

        {/* Stone/brick texture overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="bricks" width="60" height="30" patternUnits="userSpaceOnUse">
              <rect width="60" height="30" fill="none" stroke="#4a3728" strokeWidth="1" />
              <line x1="30" y1="0" x2="30" y2="15" stroke="#4a3728" strokeWidth="1" />
              <line x1="0" y1="15" x2="60" y2="15" stroke="#4a3728" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bricks)" />
        </svg>

        {/* Decorative elements - torches, crystals, etc */}
        <div className="absolute left-20 top-40 text-4xl opacity-60 animate-pulse">🔥</div>
        <div className="absolute right-40 top-60 text-4xl opacity-60 animate-pulse">🔥</div>
        <div className="absolute left-60 bottom-40 text-3xl opacity-50">💎</div>
        <div className="absolute right-80 bottom-60 text-3xl opacity-50">💎</div>
        <div className="absolute left-1/3 top-20 text-2xl opacity-40">⚔️</div>
        <div className="absolute right-1/4 top-32 text-2xl opacity-40">🛡️</div>

        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map(([fromId, toId], idx) => {
            const from = questMap.get(fromId);
            const to = questMap.get(toId);
            if (!from || !to) return null;

            const isCompleted = from.status === 'completed';

            return (
              <g key={idx}>
                {/* Path glow for completed */}
                {isCompleted && (
                  <line
                    x1={from.quest.node_x}
                    y1={from.quest.node_y}
                    x2={to.quest.node_x}
                    y2={to.quest.node_y}
                    stroke="#f59e0b"
                    strokeWidth="8"
                    opacity="0.3"
                  />
                )}
                {/* Main path */}
                <line
                  x1={from.quest.node_x}
                  y1={from.quest.node_y}
                  x2={to.quest.node_x}
                  y2={to.quest.node_y}
                  stroke={isCompleted ? '#f59e0b' : '#4a3728'}
                  strokeWidth="4"
                  strokeDasharray={isCompleted ? 'none' : '8 8'}
                  opacity={isCompleted ? 0.8 : 0.5}
                />
              </g>
            );
          })}
        </svg>

        {/* Quest Flags */}
        {quests.map((item) => (
          <QuestFlag
            key={item.quest.id}
            quest={item}
            isSelected={selectedQuestId === item.quest.id}
            onClick={() => onSelectQuest(item.quest.id)}
          />
        ))}
      </div>

      {/* Quest Popup (positioned near the selected quest) */}
      {selectedQuest && (
        <QuestPopup
          quest={selectedQuest}
          position={{
            x: (selectedQuest.quest.node_x * scale + offset.x),
            y: (selectedQuest.quest.node_y * scale + offset.y),
          }}
          onClose={() => onSelectQuest(null)}
        />
      )}

      {/* Instructions hint */}
      <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
        Drag to pan • Scroll to zoom
      </div>
    </div>
  );
}
