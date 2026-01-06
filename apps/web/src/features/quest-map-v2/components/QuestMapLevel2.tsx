'use client';

import { QuestWithStatus } from '../hooks/useQuestProgress';
import QuestNode from './QuestNode';
import QuestConnections from './QuestConnections';

interface QuestMapLevel2Props {
  quests: QuestWithStatus[];
  selectedQuestId: number | null;
  currentQuest: QuestWithStatus | undefined;
  onSelectQuest: (questId: number) => void;
}

// Crystal decorations for cave theme
const CRYSTAL_DECORATIONS = [
  // Background crystals (smaller, dimmer)
  { x: 5, y: 20, color: '#8B5CF6', scale: 0.4, opacity: 0.3, rotation: -15 },
  { x: 95, y: 15, color: '#6366F1', scale: 0.35, opacity: 0.25, rotation: 20 },
  { x: 15, y: 8, color: '#A78BFA', scale: 0.45, opacity: 0.35, rotation: 10 },
  { x: 88, y: 10, color: '#818CF8', scale: 0.4, opacity: 0.3, rotation: -25 },

  // Mid-ground crystals
  { x: 8, y: 55, color: '#8B5CF6', scale: 0.6, opacity: 0.5, rotation: -10, glow: true },
  { x: 92, y: 50, color: '#06B6D4', scale: 0.55, opacity: 0.45, rotation: 15, glow: true },
  { x: 25, y: 85, color: '#A78BFA', scale: 0.65, opacity: 0.55, rotation: -20, glow: true },

  // Foreground crystals (larger, glowing)
  { x: 3, y: 90, color: '#8B5CF6', scale: 0.9, opacity: 0.7, rotation: -5, glow: true, animate: true },
  { x: 97, y: 88, color: '#3B82F6', scale: 0.85, opacity: 0.65, rotation: 8, glow: true, animate: true },
  { x: 70, y: 95, color: '#06B6D4', scale: 0.8, opacity: 0.6, rotation: -12, glow: true, animate: true },
];

// Crystal sparkle colors
const SPARKLE_COLORS = ['#A78BFA', '#818CF8', '#6366F1', '#8B5CF6', '#06B6D4', '#3B82F6'];

export default function QuestMapLevel2({
  quests,
  selectedQuestId,
  currentQuest,
  onSelectQuest,
}: QuestMapLevel2Props) {
  const completedCount = quests.filter(q => q.status === 'completed').length;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {/* ============================================
          LAYER 0: Deep Cave Gradient Base
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              #0f0a1a 0%,
              #1a1033 20%,
              #1e1a3d 40%,
              #1a1a3e 60%,
              #15152d 80%,
              #0d0d1a 100%
            )
          `,
          zIndex: 0,
        }}
      />

      {/* ============================================
          LAYER 1: Cave Rock Texture
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% 100%, rgba(75, 85, 99, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(75, 85, 99, 0.25) 0%, transparent 45%),
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(30, 30, 50, 0.4) 0%, transparent 60%)
          `,
          zIndex: 1,
        }}
      />

      {/* ============================================
          LAYER 2: Cave Ceiling Stalactites (CSS shapes)
          ============================================ */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
        <defs>
          <linearGradient id="stalactite-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1f2937" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Stalactites from top */}
        <polygon points="5,0 7,25 3,25" fill="url(#stalactite-grad)" />
        <polygon points="15,0 18,35 12,35" fill="url(#stalactite-grad)" />
        <polygon points="30,0 33,20 27,20" fill="url(#stalactite-grad)" />
        <polygon points="45,0 48,30 42,30" fill="url(#stalactite-grad)" />
        <polygon points="60,0 62,22 58,22" fill="url(#stalactite-grad)" />
        <polygon points="75,0 78,28 72,28" fill="url(#stalactite-grad)" />
        <polygon points="88,0 91,18 85,18" fill="url(#stalactite-grad)" />
        <polygon points="95,0 97,32 93,32" fill="url(#stalactite-grad)" />
      </svg>

      {/* ============================================
          LAYER 3: Crystal Glow Ambient Light
          ============================================ */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 50% at 10% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 35% 45% at 90% 55%, rgba(59, 130, 246, 0.12) 0%, transparent 45%),
            radial-gradient(ellipse 50% 40% at 50% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)
          `,
          zIndex: 3,
        }}
      />

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
          LAYER 5: Crystal Decorations
          ============================================ */}
      {CRYSTAL_DECORATIONS.map((crystal, i) => (
        <div
          key={`crystal-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${crystal.x}%`,
            top: `${crystal.y}%`,
            transform: `translate(-50%, -100%) rotate(${crystal.rotation}deg)`,
            zIndex: 5 + (crystal.scale > 0.7 ? 3 : 0),
            opacity: crystal.opacity,
            animation: crystal.animate ? `crystalGlow ${4 + i}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.5}s`,
          }}
        >
          {/* Crystal shape using CSS */}
          <div
            style={{
              width: 20 * crystal.scale,
              height: 50 * crystal.scale,
              background: `linear-gradient(180deg, ${crystal.color} 0%, ${crystal.color}88 50%, ${crystal.color}44 100%)`,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              filter: crystal.glow ? `drop-shadow(0 0 ${8 * crystal.scale}px ${crystal.color})` : 'none',
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
            showStartHere={quest.id === 11 && quest.status === 'unlocked'}
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
              filter: 'drop-shadow(2px 3px 5px rgba(0,0,0,0.8))',
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
                background: 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)',
                color: '#1e1033',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5), 0 0 10px rgba(139,92,246,0.4)',
                border: '1px solid #C4B5FD',
              }}
            >
              YOU
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          LAYER 8: Crystal Light Beams
          ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 20% 80% at 10% 60%,
              rgba(139, 92, 246, 0.08) 0%,
              transparent 70%
            ),
            radial-gradient(ellipse 15% 60% at 90% 55%,
              rgba(59, 130, 246, 0.06) 0%,
              transparent 60%
            ),
            radial-gradient(ellipse 25% 50% at 50% 90%,
              rgba(6, 182, 212, 0.05) 0%,
              transparent 50%
            )
          `,
          animation: 'lightRaysPulse 10s ease-in-out infinite',
          zIndex: 15,
        }}
      />

      {/* ============================================
          LAYER 9: Floating Crystal Sparkles
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 18 }}>
        {[...Array(15)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${5 + (i * 6.5)}%`,
              top: `${20 + ((i * 17) % 60)}%`,
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              background: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
              boxShadow: `0 0 ${4 + (i % 3) * 2}px ${SPARKLE_COLORS[i % SPARKLE_COLORS.length]}`,
              animation: `caveParticle ${3 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* ============================================
          LAYER 10: Cave Fog (edges - darker)
          ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg,
              rgba(15, 10, 26, 0.4) 0%,
              transparent 20%,
              transparent 80%,
              rgba(15, 10, 26, 0.4) 100%
            ),
            linear-gradient(180deg,
              rgba(15, 10, 26, 0.3) 0%,
              transparent 15%,
              transparent 85%,
              rgba(15, 10, 26, 0.5) 100%
            )
          `,
          zIndex: 20,
        }}
      />

      {/* ============================================
          UI: Crystal Cave Level Banner
          ============================================ */}
      <div className="absolute top-4 left-4 z-30">
        <div
          className="relative px-5 py-3"
          style={{
            background: 'linear-gradient(180deg, #3730a3 0%, #1e1b4b 50%, #0f0a2e 100%)',
            borderRadius: '10px',
            border: '3px solid #6366f1',
            boxShadow: `
              0 6px 16px rgba(0,0,0,0.6),
              0 0 20px rgba(99, 102, 241, 0.3),
              inset 0 2px 4px rgba(255,255,255,0.1),
              inset 0 -3px 6px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* Crystal shine overlay */}
          <div
            className="absolute inset-0 opacity-20 rounded-md overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(
                135deg,
                transparent 0%,
                rgba(255,255,255,0.2) 50%,
                transparent 100%
              )`,
            }}
          />

          {/* Crystal decorations on banner */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4"
            style={{
              background: 'linear-gradient(180deg, #A78BFA 0%, #8B5CF6 100%)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              filter: 'drop-shadow(0 0 4px #8B5CF6)',
            }}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4"
            style={{
              background: 'linear-gradient(180deg, #818CF8 0%, #6366F1 100%)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              filter: 'drop-shadow(0 0 4px #6366F1)',
            }}
          />

          <h2
            className="text-lg font-bold relative"
            style={{
              color: '#C4B5FD',
              textShadow: '2px 2px 3px rgba(0,0,0,0.8), 0 0 15px rgba(139,92,246,0.5)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '0.5px',
            }}
          >
            Level 2: Crystal Cavern
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
            background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.9) 100%)',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 0 10px rgba(139,92,246,0.2)',
          }}
        >
          <span style={{ color: '#A78BFA' }}>
            {completedCount} / {quests.length}
          </span>
          <span style={{ color: '#6B6B9E' }}>Completed</span>
        </div>
      </div>
    </div>
  );
}
