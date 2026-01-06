'use client';

import React from 'react';
import { useWorld } from '../contexts/WorldContext';

interface HealthBarProps {
  current: number;
  max: number;
  color: string;
  label: string;
}

function HealthBar({ current, max, color, label }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-400 w-8">{label}</span>
      <div className="relative w-32 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
          {current}/{max}
        </span>
      </div>
    </div>
  );
}

interface XPBarProps {
  current: number;
  toNext: number;
  level: number;
}

function XPBar({ current, toNext, level }: XPBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / toNext) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center border-2 border-purple-400">
        <span className="text-xs font-bold text-white">{level}</span>
      </div>
      <div className="relative w-24 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-400">{current}/{toNext} XP</span>
    </div>
  );
}

export default function PlayerHUD() {
  const { worldState, combatState } = useWorld();

  if (!worldState) return null;

  const { player } = worldState;
  const hp = combatState.isInCombat ? combatState.playerHp : player.hp;
  const maxHp = combatState.isInCombat ? combatState.playerMaxHp : player.max_hp;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur rounded-lg p-4 border border-gray-700 shadow-xl">
        {/* Zone Name */}
        <div className="mb-3 pb-2 border-b border-gray-700">
          <h2 className="text-sm font-bold text-white">{player.zone_name}</h2>
          <p className="text-xs text-gray-400">
            Position: ({player.position.x}, {player.position.y})
          </p>
        </div>

        {/* Health & Mana */}
        <div className="space-y-2 mb-3">
          <HealthBar current={hp} max={maxHp} color="bg-red-500" label="HP" />
          <HealthBar current={player.mp} max={player.max_mp} color="bg-blue-500" label="MP" />
        </div>

        {/* XP & Level */}
        <div className="mb-3">
          <XPBar current={player.xp} toNext={player.xp_to_next} level={player.level} />
        </div>

        {/* Stats & Gold */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-3">
            <span className="text-red-400" title="Attack">
              ATK {player.attack}
            </span>
            <span className="text-blue-400" title="Defense">
              DEF {player.defense}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">G</span>
            <span className="text-yellow-300 font-bold">{player.gold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
