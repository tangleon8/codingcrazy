'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isInitialized, setIsInitialized] = useState(false);

  // Map dimensions (the world size)
  const MAP_WIDTH = 1200;
  const MAP_HEIGHT = 1000;

  // Center the map on the first available quest
  useEffect(() => {
    if (containerRef.current && quests.length > 0 && !isInitialized) {
      const rect = containerRef.current.getBoundingClientRect();

      // Find the first unlocked quest to center on
      const startQuest = quests.find(q => q.status === 'unlocked') || quests[0];
      const centerX = startQuest.quest.node_x;
      const centerY = startQuest.quest.node_y;

      // Calculate offset to center this quest in the viewport
      setOffset({
        x: (rect.width / 2) - (centerX * scale),
        y: (rect.height / 2) - (centerY * scale),
      });
      setIsInitialized(true);
    }
  }, [quests, scale, isInitialized]);

  // Pan handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.4, Math.min(1.5, scale * delta));

    // Adjust offset to zoom toward mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleRatio = newScale / scale;
      setOffset(prev => ({
        x: mouseX - (mouseX - prev.x) * scaleRatio,
        y: mouseY - (mouseY - prev.y) * scaleRatio,
      }));
    }

    setScale(newScale);
  }, [scale]);

  // Find selected quest
  const selectedQuest = quests.find((q) => q.quest.id === selectedQuestId);

  // Build quest map for connections
  const questMap = new Map(quests.map((q) => [q.quest.id, q]));

  // Count completed quests
  const completedCount = quests.filter((q) => q.status === 'completed').length;

  // Close popup when clicking on map background
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (e.target === mapRef.current || e.target === containerRef.current) {
      onSelectQuest(null);
    }
  }, [onSelectQuest]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none"
      style={{
        background: 'linear-gradient(180deg, #0d0d0d 0%, #1a0f0a 30%, #2d1810 60%, #1a1a2e 100%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleMapClick}
    >
      {/* World Title Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <div className="relative">
          <div className="bg-gradient-to-b from-red-800 to-red-900 px-8 py-2 rounded-lg border-2 border-yellow-600 shadow-lg">
            <h1 className="text-xl font-bold text-yellow-100 tracking-wide text-center">
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
        ref={mapRef}
        className="absolute"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
        }}
      >
        {/* Background - Dungeon Stone Floor */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `
              radial-gradient(ellipse at 50% 30%, rgba(80, 50, 30, 0.6) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 70%, rgba(60, 40, 20, 0.4) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 60%, rgba(70, 45, 25, 0.4) 0%, transparent 40%),
              linear-gradient(180deg, #2a1a10 0%, #1a1008 50%, #0d0805 100%)
            `,
            boxShadow: 'inset 0 0 200px rgba(0,0,0,0.8)',
          }}
        />

        {/* Stone/brick texture overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
          <defs>
            <pattern id="bricks" width="80" height="40" patternUnits="userSpaceOnUse">
              <rect width="80" height="40" fill="none" stroke="#5a4030" strokeWidth="1" />
              <line x1="40" y1="0" x2="40" y2="20" stroke="#5a4030" strokeWidth="1" />
              <line x1="0" y1="20" x2="80" y2="20" stroke="#5a4030" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bricks)" />
        </svg>

        {/* Decorative elements */}
        <div className="absolute left-[5%] top-[10%] text-4xl opacity-50 animate-pulse pointer-events-none">🔥</div>
        <div className="absolute right-[10%] top-[15%] text-4xl opacity-50 animate-pulse pointer-events-none">🔥</div>
        <div className="absolute left-[8%] bottom-[20%] text-4xl opacity-50 animate-pulse pointer-events-none">🔥</div>
        <div className="absolute right-[5%] bottom-[25%] text-4xl opacity-50 animate-pulse pointer-events-none">🔥</div>
        <div className="absolute left-[15%] top-[40%] text-3xl opacity-40 pointer-events-none">💎</div>
        <div className="absolute right-[12%] top-[50%] text-3xl opacity-40 pointer-events-none">💎</div>
        <div className="absolute left-[3%] top-[60%] text-2xl opacity-30 pointer-events-none">⚔️</div>
        <div className="absolute right-[3%] top-[35%] text-2xl opacity-30 pointer-events-none">🛡️</div>
        <div className="absolute left-[50%] top-[5%] text-3xl opacity-30 pointer-events-none">👑</div>

        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map(([fromId, toId], idx) => {
            const from = questMap.get(fromId);
            const to = questMap.get(toId);
            if (!from || !to) return null;

            const isCompleted = from.status === 'completed';

            // Calculate control points for curved path
            const midX = (from.quest.node_x + to.quest.node_x) / 2;
            const midY = (from.quest.node_y + to.quest.node_y) / 2;
            const dx = to.quest.node_x - from.quest.node_x;
            const dy = to.quest.node_y - from.quest.node_y;
            const offsetX = dy * 0.2;
            const offsetY = -dx * 0.2;

            return (
              <g key={idx}>
                {/* Path glow for completed */}
                {isCompleted && (
                  <path
                    d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${midX + offsetX} ${midY + offsetY} ${to.quest.node_x} ${to.quest.node_y}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    opacity="0.3"
                  />
                )}
                {/* Main path */}
                <path
                  d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${midX + offsetX} ${midY + offsetY} ${to.quest.node_x} ${to.quest.node_y}`}
                  fill="none"
                  stroke={isCompleted ? '#f59e0b' : '#4a3728'}
                  strokeWidth="5"
                  strokeDasharray={isCompleted ? 'none' : '12 8'}
                  opacity={isCompleted ? 0.9 : 0.6}
                  strokeLinecap="round"
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

      {/* Quest Popup (fixed position, near selected quest) */}
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

      {/* Instructions hint */}
      <div className="absolute bottom-4 left-4 text-gray-500 text-xs bg-black/30 px-2 py-1 rounded pointer-events-none">
        Drag to pan • Scroll to zoom
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale(s => Math.min(1.5, s * 1.2))}
          className="w-8 h-8 bg-stone-800 hover:bg-stone-700 text-white rounded border border-stone-600 flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.4, s * 0.8))}
          className="w-8 h-8 bg-stone-800 hover:bg-stone-700 text-white rounded border border-stone-600 flex items-center justify-center"
        >
          -
        </button>
      </div>
    </div>
  );
}
