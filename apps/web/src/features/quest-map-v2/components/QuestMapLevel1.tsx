'use client';

import Image from 'next/image';
import { QuestWithStatus } from '../hooks/useQuestProgress';
import QuestNode from './QuestNode';
import QuestConnections from './QuestConnections';

interface QuestMapLevel1Props {
  quests: QuestWithStatus[];
  selectedQuestId: number | null;
  currentQuest: QuestWithStatus | undefined;
  onSelectQuest: (questId: number) => void;
}

// Tree decoration positions (percentage-based)
const TREE_DECORATIONS = [
  { x: 3, y: 15, type: 'green' },
  { x: 97, y: 10, type: 'dark' },
  { x: 5, y: 50, type: 'golden' },
  { x: 95, y: 45, type: 'red' },
  { x: 2, y: 85, type: 'green' },
  { x: 98, y: 90, type: 'dark' },
  { x: 50, y: 5, type: 'golden' },
  { x: 70, y: 92, type: 'green' },
];

const TREE_IMAGES: Record<string, string> = {
  green: '/assets/dungeon/forest/Trees/Green-Tree.png',
  dark: '/assets/dungeon/forest/Trees/Dark-Tree.png',
  golden: '/assets/dungeon/forest/Trees/Golden-Tree.png',
  red: '/assets/dungeon/forest/Trees/Red-Tree.png',
};

export default function QuestMapLevel1({
  quests,
  selectedQuestId,
  currentQuest,
  onSelectQuest,
}: QuestMapLevel1Props) {
  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-xl"
      style={{
        background: `
          linear-gradient(180deg,
            rgba(135, 206, 235, 0.3) 0%,
            rgba(34, 139, 34, 0.6) 30%,
            rgba(34, 100, 34, 0.8) 100%
          )
        `,
      }}
    >
      {/* Forest Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/assets/dungeon/forest/Background/Background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.5,
        }}
      />

      {/* Ground layer */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 70%, rgba(34, 139, 34, 0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 30%, rgba(34, 139, 34, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(85, 107, 47, 0.4) 0%, transparent 70%)
          `,
        }}
      />

      {/* Grass texture pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
        <defs>
          <pattern id="grass-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="#228B22" />
            <circle cx="15" cy="10" r="1.5" fill="#32CD32" />
            <circle cx="10" cy="18" r="1" fill="#228B22" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grass-dots)" />
      </svg>

      {/* SVG viewBox for connections (matches percentage coordinates) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ zIndex: 2 }}
      >
        <QuestConnections quests={quests} />
      </svg>

      {/* Tree decorations */}
      {TREE_DECORATIONS.map((tree, i) => (
        <div
          key={`tree-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${tree.x}%`,
            top: `${tree.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 80,
            height: 100,
            zIndex: 3,
          }}
        >
          <Image
            src={TREE_IMAGES[tree.type]}
            alt="tree"
            width={80}
            height={100}
            style={{
              objectFit: 'contain',
              filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
            }}
          />
        </div>
      ))}

      {/* Quest nodes layer */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {quests.map((quest) => (
          <QuestNode
            key={quest.id}
            quest={quest}
            isSelected={selectedQuestId === quest.id}
            onClick={() => onSelectQuest(quest.id)}
          />
        ))}
      </div>

      {/* Player character at current quest */}
      {currentQuest && (
        <div
          className="absolute pointer-events-none transition-all duration-500 ease-out"
          style={{
            left: `${currentQuest.x}%`,
            top: `${currentQuest.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 15,
          }}
        >
          {/* Character sprite */}
          <div
            className="w-12 h-12"
            style={{
              backgroundImage: 'url(/assets/dungeon/forest/Character/Idle/Idle-Sheet.png)',
              backgroundSize: '256px 64px',
              backgroundPosition: '0 0',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
              animation: 'sprite-idle 0.8s steps(4) infinite',
            }}
          />

          {/* "YOU" indicator */}
          <div
            className="absolute -top-5 left-1/2 transform -translate-x-1/2"
            style={{
              animation: 'bounce 1s ease-in-out infinite',
            }}
          >
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
              style={{
                background: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
                color: '#7C2D12',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              YOU
            </div>
          </div>
        </div>
      )}

      {/* Level title banner */}
      <div className="absolute top-3 left-3 z-20">
        <div
          className="px-4 py-2 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, #2D5016 0%, #1a3a0c 100%)',
            border: '2px solid #4ADE80',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <h2
            className="text-lg font-bold"
            style={{
              color: '#90EE90',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            Level 1: High Forest
          </h2>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-3 right-3 z-20">
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            background: 'rgba(0,0,0,0.6)',
            color: '#90EE90',
          }}
        >
          {quests.filter(q => q.status === 'completed').length} / {quests.length} Completed
        </div>
      </div>

      {/* CSS Animation for sprite */}
      <style jsx global>{`
        @keyframes sprite-idle {
          from { background-position: 0 0; }
          to { background-position: -256px 0; }
        }
      `}</style>
    </div>
  );
}
