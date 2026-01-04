'use client';

import { useState, useRef } from 'react';
import { QuestMapItem } from '@/lib/api';
import QuestNode from './QuestNode';
import QuestConnections from './QuestConnections';

interface QuestMapProps {
  quests: QuestMapItem[];
  connections: [number, number][];
  selectedQuestId: number | null;
  onSelectQuest: (questId: number) => void;
}

export default function QuestMap({
  quests,
  connections,
  selectedQuestId,
  onSelectQuest,
}: QuestMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 1000 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.5, Math.min(2, scale * delta));
    setScale(newScale);
  };

  // Build quest map for O(1) lookup
  const questMap = new Map(quests.map((q) => [q.quest.id, q]));

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / scale} ${viewBox.height / scale}`}
        className="w-full h-full"
        style={{
          background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        {/* Background decorations */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#0f3460"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect
          x="-500"
          y="-500"
          width="2000"
          height="2000"
          fill="url(#grid)"
        />

        {/* Connections between quests */}
        <QuestConnections connections={connections} questMap={questMap} />

        {/* Quest nodes */}
        {quests.map((item) => (
          <QuestNode
            key={item.quest.id}
            quest={item}
            isSelected={selectedQuestId === item.quest.id}
            onClick={() => onSelectQuest(item.quest.id)}
          />
        ))}
      </svg>
    </div>
  );
}
