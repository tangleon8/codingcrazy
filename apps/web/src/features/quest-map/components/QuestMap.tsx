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
  const [offset, setOffset] = useState({ x: 200, y: -300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.7);

  // Map dimensions
  const MAP_WIDTH = 1200;
  const MAP_HEIGHT = 1100;

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
    setScale((s) => Math.max(0.3, Math.min(1.5, s * delta)));
  }, []);

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
        background: 'linear-gradient(180deg, #0d0808 0%, #1a0f0a 40%, #2d1810 70%, #1a1a2e 100%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        minHeight: '500px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* World Title Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-gradient-to-b from-red-700 to-red-900 px-6 py-2 rounded-lg border-2 border-yellow-500 shadow-xl">
          <h1 className="text-lg font-bold text-yellow-100 text-center">CODE DUNGEON</h1>
          <div className="text-center text-yellow-200 text-sm">{completedCount}/{quests.length}</div>
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
        {/* Dark dungeon background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `
              radial-gradient(ellipse at 50% 40%, rgba(60, 40, 20, 0.5) 0%, transparent 60%),
              linear-gradient(180deg, #1a1008 0%, #0d0805 100%)
            `,
            border: '4px solid #3d2817',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
          }}
        />

        {/* Torch decorations */}
        <div className="absolute left-8 top-20 text-3xl animate-pulse">🔥</div>
        <div className="absolute right-8 top-20 text-3xl animate-pulse">🔥</div>
        <div className="absolute left-8 bottom-20 text-3xl animate-pulse">🔥</div>
        <div className="absolute right-8 bottom-20 text-3xl animate-pulse">🔥</div>

        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map(([fromId, toId], idx) => {
            const from = questMap.get(fromId);
            const to = questMap.get(toId);
            if (!from || !to) return null;

            const isCompleted = from.status === 'completed';

            return (
              <line
                key={idx}
                x1={from.quest.node_x}
                y1={from.quest.node_y}
                x2={to.quest.node_x}
                y2={to.quest.node_y}
                stroke={isCompleted ? '#f59e0b' : '#5a4030'}
                strokeWidth={isCompleted ? 6 : 4}
                strokeDasharray={isCompleted ? 'none' : '10 6'}
                opacity={0.7}
              />
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

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => setScale(s => Math.min(1.5, s * 1.2))}
          className="w-10 h-10 bg-amber-900 hover:bg-amber-800 text-white rounded-lg border-2 border-amber-600 text-xl font-bold"
        >
          +
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s * 0.8))}
          className="w-10 h-10 bg-amber-900 hover:bg-amber-800 text-white rounded-lg border-2 border-amber-600 text-xl font-bold"
        >
          -
        </button>
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 left-4 text-amber-200/50 text-xs z-20">
        Drag to pan • Scroll to zoom • Click flags to play
      </div>
    </div>
  );
}
