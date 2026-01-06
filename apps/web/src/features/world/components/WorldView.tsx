'use client';

import React, { useEffect, useState } from 'react';
import { WorldProvider, useWorld } from '../contexts/WorldContext';
import PlayerHUD from './PlayerHUD';
import CombatUI from './CombatUI';
import InventoryPanel from './InventoryPanel';
import NPCDialogModal from './NPCDialogModal';
import { NearbyEntity } from '@/lib/api';

function WorldContent() {
  const {
    worldState,
    combatState,
    isLoading,
    error,
    loadWorldState,
    loadInventory,
    startCombat,
    openChest,
    respawn,
  } = useWorld();

  const [showInventory, setShowInventory] = useState(false);
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadWorldState();
    loadInventory();
  }, [loadWorldState, loadInventory]);

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleEntityClick = async (entity: NearbyEntity) => {
    switch (entity.entity_type) {
      case 'enemy':
        const enemyId = parseInt(entity.id);
        const started = await startCombat(enemyId);
        if (!started) {
          showMessage('Failed to start combat');
        }
        break;
      case 'npc':
        setActiveNpcId(entity.id);
        break;
      case 'chest':
        const opened = await openChest(entity.id);
        if (opened) {
          showMessage('Chest opened!');
        } else {
          showMessage('Failed to open chest');
        }
        break;
    }
  };

  if (isLoading && !worldState) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading world...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  const playerDead = worldState?.player.hp === 0;

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* HUD */}
      <PlayerHUD />

      {/* Inventory Button */}
      <button
        onClick={() => setShowInventory(true)}
        className="fixed top-4 right-4 z-40 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600"
      >
        Inventory
      </button>

      {/* Action Message */}
      {actionMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-gray-800 text-white px-6 py-3 rounded-lg border border-gray-600 shadow-lg">
          {actionMessage}
        </div>
      )}

      {/* World Canvas Area */}
      <div className="flex items-center justify-center h-full pt-20">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-4xl w-full">
          <h2 className="text-xl font-bold text-white mb-4">
            {worldState?.zone.name}
          </h2>
          <p className="text-gray-400 mb-4">
            {worldState?.zone.description || 'An unexplored area...'}
          </p>

          {/* Nearby Entities */}
          <div className="space-y-4">
            {/* Enemies */}
            {worldState?.nearby_enemies && worldState.nearby_enemies.length > 0 && (
              <div>
                <h3 className="text-red-400 font-medium mb-2">Nearby Enemies</h3>
                <div className="flex flex-wrap gap-2">
                  {worldState.nearby_enemies.map((enemy) => (
                    <button
                      key={enemy.id}
                      onClick={() => handleEntityClick(enemy)}
                      className="bg-red-900/50 hover:bg-red-800/50 border border-red-600 rounded-lg px-4 py-2 text-white"
                    >
                      {enemy.name} ({enemy.distance} tiles away)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NPCs */}
            {worldState?.nearby_npcs && worldState.nearby_npcs.length > 0 && (
              <div>
                <h3 className="text-blue-400 font-medium mb-2">Nearby NPCs</h3>
                <div className="flex flex-wrap gap-2">
                  {worldState.nearby_npcs.map((npc) => (
                    <button
                      key={npc.id}
                      onClick={() => handleEntityClick(npc)}
                      className="bg-blue-900/50 hover:bg-blue-800/50 border border-blue-600 rounded-lg px-4 py-2 text-white"
                    >
                      {npc.name} ({npc.distance} tiles away)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chests */}
            {worldState?.nearby_chests && worldState.nearby_chests.length > 0 && (
              <div>
                <h3 className="text-yellow-400 font-medium mb-2">Nearby Chests</h3>
                <div className="flex flex-wrap gap-2">
                  {worldState.nearby_chests.map((chest) => (
                    <button
                      key={chest.id}
                      onClick={() => handleEntityClick(chest)}
                      className="bg-yellow-900/50 hover:bg-yellow-800/50 border border-yellow-600 rounded-lg px-4 py-2 text-white"
                    >
                      {chest.name} ({chest.distance} tiles away)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No entities */}
            {(!worldState?.nearby_enemies?.length &&
              !worldState?.nearby_npcs?.length &&
              !worldState?.nearby_chests?.length) && (
              <p className="text-gray-500 text-center py-8">
                Nothing of interest nearby. Move around to explore!
              </p>
            )}
          </div>

          {/* Code Editor Hint */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center">
              Write JavaScript code to control your character. Use <code className="text-green-400">hero.move(&quot;up&quot;)</code>, <code className="text-green-400">hero.attack()</code>, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Death Overlay */}
      {playerDead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-gray-900 rounded-xl border-2 border-red-600 p-8 text-center">
            <h2 className="text-3xl font-bold text-red-500 mb-4">You Died!</h2>
            <p className="text-gray-400 mb-6">You lost some gold...</p>
            <button
              onClick={respawn}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg"
            >
              Respawn
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CombatUI />
      <InventoryPanel isOpen={showInventory} onClose={() => setShowInventory(false)} />
      <NPCDialogModal npcId={activeNpcId} onClose={() => setActiveNpcId(null)} />
    </div>
  );
}

export default function WorldView() {
  return (
    <WorldProvider>
      <WorldContent />
    </WorldProvider>
  );
}
