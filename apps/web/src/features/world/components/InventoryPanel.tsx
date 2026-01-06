'use client';

import React, { useState } from 'react';
import { useWorld } from '../contexts/WorldContext';
import { ItemInfo } from '@/lib/api';

interface ItemSlotProps {
  item: ItemInfo | null;
  onClick?: () => void;
  isSelected?: boolean;
  slotLabel?: string;
}

function ItemSlot({ item, onClick, isSelected, slotLabel }: ItemSlotProps) {
  const rarityColors: Record<string, string> = {
    common: 'border-gray-500',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500',
  };

  const borderColor = item ? rarityColors[item.rarity] || 'border-gray-600' : 'border-gray-700';

  return (
    <button
      onClick={onClick}
      className={`
        relative w-14 h-14 rounded-lg border-2 ${borderColor}
        ${isSelected ? 'ring-2 ring-white' : ''}
        ${item ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-900'}
        transition-all
      `}
    >
      {item ? (
        <>
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {getItemIcon(item.item_type)}
          </div>
          {item.quantity > 1 && (
            <span className="absolute bottom-0 right-1 text-xs font-bold text-white bg-black/70 px-1 rounded">
              {item.quantity}
            </span>
          )}
          {item.is_equipped && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white" />
          )}
        </>
      ) : slotLabel ? (
        <span className="text-xs text-gray-600">{slotLabel}</span>
      ) : null}
    </button>
  );
}

function getItemIcon(itemType: string): string {
  const icons: Record<string, string> = {
    weapon: '\u2694\uFE0F',
    armor: '\uD83D\uDEE1\uFE0F',
    consumable: '\u2728',
    key: '\uD83D\uDD11',
    material: '\uD83D\uDCE6',
  };
  return icons[itemType] || '\u2753';
}

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryPanel({ isOpen, onClose }: InventoryPanelProps) {
  const { inventory, useItem, equipItem, loadInventory } = useWorld();
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);

  if (!isOpen) return null;

  const handleUse = async () => {
    if (selectedItem) {
      await useItem(selectedItem.id);
      setSelectedItem(null);
      await loadInventory();
    }
  };

  const handleEquip = async () => {
    if (selectedItem) {
      await equipItem(selectedItem.id);
      setSelectedItem(null);
      await loadInventory();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Inventory</h2>
          <div className="flex items-center gap-4">
            <span className="text-yellow-400 font-bold">
              {inventory?.gold || 0} Gold
            </span>
            <span className="text-gray-400 text-sm">
              {inventory?.used_slots || 0}/{inventory?.max_slots || 30} slots
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              X
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Equipment Slots */}
          <div className="w-48">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Equipment</h3>
            <div className="grid grid-cols-2 gap-2">
              <ItemSlot
                item={inventory?.equipped.weapon || null}
                slotLabel="Weapon"
                onClick={() => inventory?.equipped.weapon && setSelectedItem(inventory.equipped.weapon)}
              />
              <ItemSlot
                item={inventory?.equipped.head || null}
                slotLabel="Head"
                onClick={() => inventory?.equipped.head && setSelectedItem(inventory.equipped.head)}
              />
              <ItemSlot
                item={inventory?.equipped.chest || null}
                slotLabel="Chest"
                onClick={() => inventory?.equipped.chest && setSelectedItem(inventory.equipped.chest)}
              />
              <ItemSlot
                item={inventory?.equipped.legs || null}
                slotLabel="Legs"
                onClick={() => inventory?.equipped.legs && setSelectedItem(inventory.equipped.legs)}
              />
              <ItemSlot
                item={inventory?.equipped.feet || null}
                slotLabel="Feet"
                onClick={() => inventory?.equipped.feet && setSelectedItem(inventory.equipped.feet)}
              />
              <ItemSlot
                item={inventory?.equipped.accessory || null}
                slotLabel="Acc"
                onClick={() => inventory?.equipped.accessory && setSelectedItem(inventory.equipped.accessory)}
              />
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Items</h3>
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
              {inventory?.items.map((item) => (
                <ItemSlot
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 20 - (inventory?.items.length || 0)) }).map((_, i) => (
                <ItemSlot key={`empty-${i}`} item={null} />
              ))}
            </div>
          </div>
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{selectedItem.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{selectedItem.description}</p>
                <div className="flex gap-4 text-sm">
                  {selectedItem.attack_bonus > 0 && (
                    <span className="text-red-400">+{selectedItem.attack_bonus} ATK</span>
                  )}
                  {selectedItem.defense_bonus > 0 && (
                    <span className="text-blue-400">+{selectedItem.defense_bonus} DEF</span>
                  )}
                  {selectedItem.hp_bonus > 0 && (
                    <span className="text-green-400">+{selectedItem.hp_bonus} HP</span>
                  )}
                  {selectedItem.effect_type && (
                    <span className="text-purple-400">
                      {selectedItem.effect_type}: {selectedItem.effect_value}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {selectedItem.item_type === 'consumable' && (
                  <button
                    onClick={handleUse}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Use
                  </button>
                )}
                {(selectedItem.item_type === 'weapon' || selectedItem.item_type === 'armor') && !selectedItem.is_equipped && (
                  <button
                    onClick={handleEquip}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Equip
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
