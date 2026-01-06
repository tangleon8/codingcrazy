'use client';

import React from 'react';
import { useWorld } from '../contexts/WorldContext';

interface CombatHealthBarProps {
  current: number;
  max: number;
  label: string;
  isEnemy?: boolean;
}

function CombatHealthBar({ current, max, label, isEnemy = false }: CombatHealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor = isEnemy ? 'bg-red-600' : 'bg-green-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-white">{label}</span>
        <span className="text-gray-300">{current}/{max}</span>
      </div>
      <div className="relative h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function CombatUI() {
  const { combatState, performCombatAction, inventory } = useWorld();

  if (!combatState.isInCombat || !combatState.enemy) {
    return null;
  }

  const { enemy, enemyHp, playerHp, playerMaxHp, lastPlayerAction, lastEnemyAction } = combatState;

  const handleAction = async (action: string) => {
    await performCombatAction(action);
  };

  const handleUsePotion = async () => {
    // Find a health potion in inventory
    const potion = inventory?.items.find(
      item => item.item_type === 'consumable' && item.effect_type === 'heal'
    );
    if (potion) {
      await performCombatAction('useItem', potion.id);
    }
  };

  const hasPotion = inventory?.items.some(
    item => item.item_type === 'consumable' && item.effect_type === 'heal' && item.quantity > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-xl border-2 border-red-600 p-6 w-full max-w-lg shadow-2xl">
        {/* Combat Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-500">COMBAT</h2>
          <p className="text-gray-400">vs {enemy.name} (Lv. {enemy.level})</p>
        </div>

        {/* Health Bars */}
        <div className="space-y-4 mb-6">
          <CombatHealthBar
            current={playerHp}
            max={playerMaxHp}
            label="Your HP"
          />
          <CombatHealthBar
            current={enemyHp}
            max={enemy.max_hp}
            label={enemy.name}
            isEnemy
          />
        </div>

        {/* Combat Log */}
        <div className="bg-gray-800 rounded-lg p-3 mb-6 min-h-[60px] border border-gray-700">
          {lastPlayerAction && (
            <p className="text-green-400 text-sm mb-1">{lastPlayerAction}</p>
          )}
          {lastEnemyAction && (
            <p className="text-red-400 text-sm">{lastEnemyAction}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAction('attack')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Attack
          </button>
          <button
            onClick={() => handleAction('defend')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Defend
          </button>
          <button
            onClick={handleUsePotion}
            disabled={!hasPotion}
            className={`font-bold py-3 px-4 rounded-lg transition-colors ${
              hasPotion
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Use Potion
          </button>
          <button
            onClick={() => handleAction('flee')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Flee
          </button>
        </div>

        {/* Enemy Stats */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-center gap-6 text-sm text-gray-400">
          <span>ATK: {enemy.attack}</span>
          <span>DEF: {enemy.defense}</span>
          <span>XP: {enemy.xp_reward}</span>
          <span>Gold: {enemy.coin_reward}</span>
        </div>
      </div>
    </div>
  );
}
