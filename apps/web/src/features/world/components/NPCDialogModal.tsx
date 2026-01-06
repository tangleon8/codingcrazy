'use client';

import React, { useState, useEffect } from 'react';
import { api, NPCInfo, DialogueNode, ShopItem } from '@/lib/api';
import { useWorld } from '../contexts/WorldContext';

interface NPCDialogModalProps {
  npcId: string | null;
  onClose: () => void;
}

export default function NPCDialogModal({ npcId, onClose }: NPCDialogModalProps) {
  const { loadInventory, worldState } = useWorld();
  const [npc, setNpc] = useState<NPCInfo | null>(null);
  const [dialogueNode, setDialogueNode] = useState<DialogueNode | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [showShop, setShowShop] = useState(false);
  const [playerGold, setPlayerGold] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (npcId) {
      loadDialogue();
    }
  }, [npcId]);

  const loadDialogue = async () => {
    if (!npcId) return;
    try {
      const response = await api.getDialogue(npcId);
      setNpc(response.npc);
      setDialogueNode(response.current_node);
      setShowShop(false);
    } catch (err) {
      console.error('Failed to load dialogue:', err);
    }
  };

  const handleSelectOption = async (index: number) => {
    if (!npcId) return;
    try {
      const response = await api.respondToDialogue(npcId, index);

      if (response.shop_opened && npc?.is_shopkeeper) {
        await loadShop();
      } else if (response.conversation_ended) {
        onClose();
      } else if (response.next_node) {
        setDialogueNode(response.next_node);
      }
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  };

  const loadShop = async () => {
    if (!npcId) return;
    try {
      const response = await api.getShop(npcId);
      setShopItems(response.items);
      setPlayerGold(response.player_gold);
      setShowShop(true);
    } catch (err) {
      console.error('Failed to load shop:', err);
    }
  };

  const handleBuy = async (itemId: string, price: number) => {
    if (!npcId) return;
    try {
      const response = await api.buyItem(npcId, itemId, 1);
      setPlayerGold(response.remaining_gold);
      setMessage(`Purchased ${response.item_name}!`);
      await loadInventory();
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Purchase failed');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (!npcId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 bg-black/50">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl shadow-2xl">
        {/* NPC Header */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-700">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            {npc?.is_shopkeeper ? '\uD83D\uDCB0' : '\uD83D\uDC64'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{npc?.display_name || 'NPC'}</h2>
            <p className="text-sm text-gray-400">{npc?.npc_type}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white text-xl"
          >
            X
          </button>
        </div>

        {/* Content */}
        {showShop ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Shop</h3>
              <span className="text-yellow-400 font-bold">{playerGold} Gold</span>
            </div>

            {message && (
              <div className="mb-4 p-2 bg-blue-900/50 border border-blue-600 rounded text-blue-200 text-sm">
                {message}
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shopItems.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-xl">
                    {item.item_type === 'weapon' ? '\u2694\uFE0F' :
                     item.item_type === 'armor' ? '\uD83D\uDEE1\uFE0F' :
                     item.item_type === 'consumable' ? '\u2728' : '\uD83D\uDCE6'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <p className="text-xs text-gray-400">{item.description}</p>
                    <div className="flex gap-2 text-xs mt-1">
                      {item.attack_bonus > 0 && <span className="text-red-400">+{item.attack_bonus} ATK</span>}
                      {item.defense_bonus > 0 && <span className="text-blue-400">+{item.defense_bonus} DEF</span>}
                      {item.effect_type && <span className="text-purple-400">{item.effect_type}: {item.effect_value}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{item.price} G</p>
                    {item.stock !== -1 && (
                      <p className="text-xs text-gray-500">Stock: {item.stock}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleBuy(item.item_id, item.price)}
                    disabled={playerGold < item.price}
                    className={`px-4 py-2 rounded font-bold ${
                      playerGold >= item.price
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Buy
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShop(false)}
              className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Back to Dialogue
            </button>
          </div>
        ) : (
          <div className="p-4">
            {/* Dialogue Text */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4 min-h-[80px]">
              <p className="text-white">{dialogueNode?.text || '...'}</p>
            </div>

            {/* Dialogue Options */}
            <div className="space-y-2">
              {dialogueNode?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(index)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
