'use client';

import React, { useEffect, useState } from 'react';
import { WorldProvider, useWorld } from '../contexts/WorldContext';
import PlayerHUD from './PlayerHUD';
import CombatUI from './CombatUI';
import InventoryPanel from './InventoryPanel';
import NPCDialogModal from './NPCDialogModal';
import GameMap from './GameMap';
import { NearbyEntity } from '@/lib/api';

function WorldContent() {
  const {
    worldState,
    combatState,
    isLoading,
    error,
    loadWorldState,
    loadInventory,
    movePlayer,
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

      {/* World Map Area */}
      <div className="absolute top-16 left-0 right-0 bottom-0 bg-gray-900">
        {worldState ? (
          <GameMap
            zone={worldState.zone}
            playerPosition={worldState.player.position}
            enemies={worldState.nearby_enemies || []}
            npcs={worldState.nearby_npcs || []}
            chests={worldState.nearby_chests || []}
            onEntityClick={handleEntityClick}
            onTileClick={(x, y) => {
              movePlayer(x, y);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Loading map...</div>
          </div>
        )}
      </div>

      {/* Zone Info Overlay */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-gray-900/90 rounded-lg px-6 py-3 border border-gray-700">
        <h2 className="text-lg font-bold text-white text-center">
          {worldState?.zone.name}
        </h2>
        <p className="text-gray-400 text-sm text-center max-w-md">
          {worldState?.zone.description || 'An unexplored area...'}
        </p>
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
