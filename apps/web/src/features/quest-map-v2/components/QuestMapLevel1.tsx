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

// Enhanced tree decorations with depth layering
const TREE_DECORATIONS = [
  // Background trees (smaller, darker, further back)
  { x: 2, y: 18, type: 'dark', scale: 0.5, zIndex: 3, opacity: 0.4 },
  { x: 98, y: 12, type: 'dark', scale: 0.45, zIndex: 3, opacity: 0.35 },
  { x: 15, y: 6, type: 'green', scale: 0.5, zIndex: 3, opacity: 0.4 },
  { x: 85, y: 8, type: 'green', scale: 0.55, zIndex: 3, opacity: 0.45 },

  // Mid-ground trees
  { x: 5, y: 42, type: 'golden', scale: 0.75, zIndex: 5, opacity: 0.7 },
  { x: 95, y: 38, type: 'red', scale: 0.7, zIndex: 5, opacity: 0.65 },
  { x: 8, y: 68, type: 'green', scale: 0.8, zIndex: 5, opacity: 0.75 },

  // Foreground trees (larger, more saturated, animated)
  { x: 3, y: 88, type: 'green', scale: 1.0, zIndex: 8, opacity: 0.9, animate: true },
  { x: 97, y: 85, type: 'dark', scale: 0.95, zIndex: 8, opacity: 0.85, animate: true },
  { x: 50, y: 3, type: 'golden', scale: 0.85, zIndex: 7, opacity: 0.8 },
  { x: 72, y: 94, type: 'green', scale: 1.05, zIndex: 8, opacity: 0.88, animate: true },
];

const TREE_IMAGES: Record<string, string> = {
  green: '/assets/dungeon/forest/Trees/Green-Tree.png',
  dark: '/assets/dungeon/forest/Trees/Dark-Tree.png',
  golden: '/assets/dungeon/forest/Trees/Golden-Tree.png',
  red: '/assets/dungeon/forest/Trees/Red-Tree.png',
};

// Leaf colors for particles
const LEAF_COLORS = ['#228B22', '#32CD32', '#DAA520', '#8B4513', '#90EE90', '#6B8E23'];

export default function QuestMapLevel1({
  quests,
  selectedQuestId,
  currentQuest,
  onSelectQuest,
}: QuestMapLevel1Props) {
  const completedCount = quests.filter(q => q.status === 'completed').length;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {/* ============================================
          LAYER 0: Sky Gradient Base
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              #87CEEB 0%,
              #5DA3D9 15%,
              #4A9CD6 25%,
              #3D8C5F 50%,
              #2D6B4A 70%,
              #1E4A35 100%
            )
          `,
          zIndex: 0,
        }}
      />

      {/* ============================================
          LAYER 1: Main Forest Background
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/assets/dungeon/forest/Background/Background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.85,
          zIndex: 1,
        }}
      />

      {/* ============================================
          LAYER 2: Distant Tree Silhouettes
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/assets/dungeon/forest/Trees/Background.png)',
          backgroundSize: '120% auto',
          backgroundPosition: 'center 80%',
          backgroundRepeat: 'repeat-x',
          opacity: 0.5,
          filter: 'brightness(0.6) saturate(0.8)',
          zIndex: 2,
        }}
      />

      {/* ============================================
          LAYER 3: Ground Gradient Blend
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              transparent 0%,
              transparent 35%,
              rgba(30, 74, 53, 0.3) 55%,
              rgba(25, 60, 42, 0.5) 70%,
              rgba(20, 50, 35, 0.7) 85%,
              rgba(15, 40, 28, 0.85) 100%
            )
          `,
          zIndex: 3,
        }}
      />

      {/* Grass texture pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" style={{ zIndex: 3 }}>
        <defs>
          <pattern id="grass-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="1.2" fill="#228B22" opacity="0.8" />
            <circle cx="18" cy="12" r="1.8" fill="#32CD32" opacity="0.6" />
            <circle cx="12" cy="20" r="1" fill="#228B22" opacity="0.7" />
            <circle cx="4" cy="16" r="0.8" fill="#90EE90" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grass-dots)" />
      </svg>

      {/* ============================================
          LAYER 4: Quest Path Connections (SVG)
          ============================================ */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ zIndex: 4 }}
      >
        <QuestConnections quests={quests} />
      </svg>

      {/* ============================================
          LAYER 5: Tree Decorations with Depth
          ============================================ */}
      {TREE_DECORATIONS.map((tree, i) => (
        <div
          key={`tree-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${tree.x}%`,
            top: `${tree.y}%`,
            transform: 'translate(-50%, -100%)',
            width: 80 * tree.scale,
            height: 100 * tree.scale,
            zIndex: tree.zIndex,
            opacity: tree.opacity,
            animation: tree.animate ? `treeSway ${10 + i * 2}s ease-in-out infinite` : 'none',
          }}
        >
          <Image
            src={TREE_IMAGES[tree.type]}
            alt="tree"
            width={Math.round(80 * tree.scale)}
            height={Math.round(100 * tree.scale)}
            style={{
              objectFit: 'contain',
              filter: `drop-shadow(2px 4px ${4 + tree.scale * 4}px rgba(0,0,0,${0.2 + tree.scale * 0.15}))`,
            }}
          />
        </div>
      ))}

      {/* ============================================
          LAYER 6: Quest Nodes
          ============================================ */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {quests.map((quest) => (
          <QuestNode
            key={quest.id}
            quest={quest}
            isSelected={selectedQuestId === quest.id}
            onClick={() => onSelectQuest(quest.id)}
            showStartHere={quest.id === 1 && quest.status === 'unlocked'}
          />
        ))}
      </div>

      {/* ============================================
          LAYER 7: Player Character
          ============================================ */}
      {currentQuest && (
        <div
          className="absolute pointer-events-none transition-all duration-500 ease-out"
          style={{
            left: `${currentQuest.x}%`,
            top: `${currentQuest.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 12,
          }}
        >
          {/* Character sprite */}
          <div
            className="w-14 h-14"
            style={{
              backgroundImage: 'url(/assets/dungeon/forest/Character/Idle/Idle-Sheet.png)',
              backgroundSize: '256px 64px',
              backgroundPosition: '0 0',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(2px 3px 5px rgba(0,0,0,0.6))',
              animation: 'spriteIdle 0.8s steps(4) infinite',
            }}
          />

          {/* "YOU" indicator */}
          <div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2"
            style={{ animation: 'tutorialBounce 1.2s ease-in-out infinite' }}
          >
            <div
              className="px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap"
              style={{
                background: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)',
                color: '#7C2D12',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                border: '1px solid #FCD34D',
              }}
            >
              YOU
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          LAYER 8: Light Rays (God Rays)
          ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 35% 70% at 15% 0%,
              rgba(255, 248, 200, 0.2) 0%,
              transparent 60%
            ),
            radial-gradient(ellipse 25% 50% at 80% 5%,
              rgba(255, 255, 220, 0.15) 0%,
              transparent 50%
            ),
            radial-gradient(ellipse 40% 60% at 50% 0%,
              rgba(255, 250, 205, 0.12) 0%,
              transparent 55%
            )
          `,
          animation: 'lightRaysPulse 8s ease-in-out infinite',
          zIndex: 15,
        }}
      />

      {/* ============================================
          LAYER 9: Floating Leaves Particles
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 18 }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute"
            style={{
              left: `${8 + i * 12}%`,
              top: '-20px',
              width: '10px',
              height: '10px',
              background: LEAF_COLORS[i % LEAF_COLORS.length],
              borderRadius: '0 50% 50% 50%',
              transform: 'rotate(45deg)',
              animation: `leafFall ${12 + i * 3}s linear infinite`,
              animationDelay: `${i * 2}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* ============================================
          LAYER 10: Ambient Particles (Fireflies/Dust)
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 19 }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${5 + (i * 8)}%`,
              top: `${25 + ((i * 19) % 55)}%`,
              width: '4px',
              height: '4px',
              background: 'radial-gradient(circle, rgba(255,255,200,0.9) 0%, rgba(255,255,150,0.4) 50%, transparent 70%)',
              animation: `floatParticle ${5 + (i % 4) * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      {/* ============================================
          LAYER 11: Atmospheric Fog (edges)
          ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg,
              rgba(180, 200, 180, 0.15) 0%,
              transparent 15%,
              transparent 85%,
              rgba(180, 200, 180, 0.15) 100%
            ),
            linear-gradient(180deg,
              transparent 0%,
              transparent 75%,
              rgba(150, 180, 150, 0.1) 100%
            )
          `,
          zIndex: 20,
        }}
      />

      {/* ============================================
          UI: Wooden Sign Level Banner
          ============================================ */}
      <div className="absolute top-4 left-4 z-30">
        <div
          className="relative px-5 py-3"
          style={{
            background: 'linear-gradient(180deg, #8B7355 0%, #6B5344 50%, #4A3728 100%)',
            borderRadius: '10px',
            border: '4px solid #3D2914',
            boxShadow: `
              0 6px 16px rgba(0,0,0,0.5),
              inset 0 2px 4px rgba(255,255,255,0.15),
              inset 0 -3px 6px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Wood grain texture overlay */}
          <div
            className="absolute inset-0 opacity-25 rounded-md overflow-hidden"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent 0px,
                rgba(0,0,0,0.1) 1px,
                transparent 2px,
                transparent 10px
              )`,
            }}
          />

          {/* Nail decorations */}
          <div
            className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full"
            style={{
              background: 'linear-gradient(145deg, #6B6B6B 0%, #4A4A4A 100%)',
              border: '1px solid #3A3A3A',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          />
          <div
            className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full"
            style={{
              background: 'linear-gradient(145deg, #6B6B6B 0%, #4A4A4A 100%)',
              border: '1px solid #3A3A3A',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          />

          <h2
            className="text-lg font-bold relative"
            style={{
              color: '#F5DEB3',
              textShadow: '2px 2px 3px rgba(0,0,0,0.6), 0 0 10px rgba(245,222,179,0.2)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '0.5px',
            }}
          >
            Level 1: High Forest
          </h2>
        </div>
      </div>

      {/* ============================================
          UI: Progress Indicator
          ============================================ */}
      <div className="absolute top-4 right-4 z-30">
        <div
          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
            border: '2px solid rgba(144, 238, 144, 0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ color: '#90EE90' }}>
            {completedCount} / {quests.length}
          </span>
          <span style={{ color: '#6B8E6B' }}>Completed</span>
        </div>
      </div>
    </div>
  );
}
