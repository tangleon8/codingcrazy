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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.65);
  const [initialized, setInitialized] = useState(false);

  // Map dimensions
  const MAP_WIDTH = 1000;
  const MAP_HEIGHT = 1000;

  // Center map on first unlocked quest when component mounts
  useEffect(() => {
    if (containerRef.current && quests.length > 0 && !initialized) {
      const rect = containerRef.current.getBoundingClientRect();
      const firstQuest = quests.find(q => q.status === 'unlocked') || quests[0];

      // Center the first quest in the viewport
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
    const newScale = Math.max(0.3, Math.min(1.2, scale * delta));

    // Zoom towards mouse position
    const scaleRatio = newScale / scale;
    setOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * scaleRatio,
      y: mouseY - (mouseY - prev.y) * scaleRatio,
    }));
    setScale(newScale);
  }, [scale]);

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
        background: `
          radial-gradient(ellipse at 50% 0%, #2a1a10 0%, transparent 50%),
          radial-gradient(ellipse at 0% 100%, #1a1a2e 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, #1a0f0a 0%, transparent 50%),
          linear-gradient(180deg, #0a0605 0%, #151010 50%, #0d0a08 100%)
        `,
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
          {/* Banner background */}
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
              CODE DUNGEON
            </h1>
            <div className="text-center text-amber-200 text-sm font-medium">
              {completedCount} / {quests.length}
            </div>
          </div>
          {/* Ribbon ends */}
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
        {/* Dungeon floor background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(80, 50, 30, 0.4) 0%, transparent 70%),
              radial-gradient(ellipse at 20% 30%, rgba(60, 40, 20, 0.3) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 70%, rgba(70, 45, 25, 0.3) 0%, transparent 40%),
              linear-gradient(180deg, #1a1008 0%, #0d0805 100%)
            `,
            borderRadius: '20px',
            border: '3px solid #3d2817',
            boxShadow: 'inset 0 0 150px rgba(0,0,0,0.9), 0 0 50px rgba(0,0,0,0.5)',
          }}
        />

        {/* Brick pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" style={{ borderRadius: '20px' }}>
          <defs>
            <pattern id="dungeon-bricks" width="60" height="30" patternUnits="userSpaceOnUse">
              <rect width="60" height="30" fill="none" stroke="#8B4513" strokeWidth="1" />
              <line x1="30" y1="0" x2="30" y2="15" stroke="#8B4513" strokeWidth="1" />
              <line x1="0" y1="15" x2="60" y2="15" stroke="#8B4513" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dungeon-bricks)" rx="20" />
        </svg>

        {/* Ambient torches */}
        {[
          { x: '5%', y: '15%' },
          { x: '95%', y: '15%' },
          { x: '5%', y: '50%' },
          { x: '95%', y: '50%' },
          { x: '5%', y: '85%' },
          { x: '95%', y: '85%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute text-2xl"
            style={{
              left: pos.x,
              top: pos.y,
              animation: `pulse ${2 + (i * 0.3)}s ease-in-out infinite`,
              filter: 'drop-shadow(0 0 10px #ff6600)',
            }}
          >
            🔥
          </div>
        ))}

        {/* Connection paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <filter id="glow">
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

            // Create curved path
            const midX = (from.quest.node_x + to.quest.node_x) / 2;
            const midY = (from.quest.node_y + to.quest.node_y) / 2;
            const dx = to.quest.node_x - from.quest.node_x;
            const dy = to.quest.node_y - from.quest.node_y;
            const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
            const cx = midX + (dy > 0 ? curve : -curve) * Math.sign(dx || 1);
            const cy = midY;

            return (
              <g key={idx}>
                {isCompleted && (
                  <path
                    d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${cy} ${to.quest.node_x} ${to.quest.node_y}`}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="10"
                    opacity="0.3"
                    filter="url(#glow)"
                  />
                )}
                <path
                  d={`M ${from.quest.node_x} ${from.quest.node_y} Q ${cx} ${cy} ${to.quest.node_x} ${to.quest.node_y}`}
                  fill="none"
                  stroke={isCompleted ? '#F59E0B' : '#4a3525'}
                  strokeWidth="4"
                  strokeDasharray={isCompleted ? 'none' : '8 6'}
                  opacity={isCompleted ? 0.9 : 0.5}
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

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => setScale(s => Math.min(1.2, s * 1.15))}
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
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-amber-200/70 text-xs z-20">
        Drag to pan • Scroll to zoom • Click a flag to play
      </div>
    </div>
  );
}
