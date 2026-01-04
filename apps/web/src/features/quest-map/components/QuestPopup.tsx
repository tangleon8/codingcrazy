'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { QuestMapItem, api, QuestDetailResponse } from '@/lib/api';

interface QuestPopupProps {
  quest: QuestMapItem;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function QuestPopup({ quest, position, onClose }: QuestPopupProps) {
  const router = useRouter();
  const popupRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<QuestDetailResponse | null>(null);
  const [popupPosition, setPopupPosition] = useState({ left: 0, top: 0 });

  const { quest: q, status, stars_earned } = quest;

  // Fetch quest details
  useEffect(() => {
    api.getQuestDetail(q.id).then(setDetail).catch(console.error);
  }, [q.id]);

  // Calculate popup position to stay within viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const padding = 20;
    const popupWidth = 300;
    const popupHeight = 350;

    let left = position.x + 60;
    let top = position.y - 100;

    // Keep within viewport horizontally
    if (left + popupWidth > window.innerWidth - padding) {
      left = position.x - popupWidth - 60;
    }
    if (left < padding) {
      left = padding;
    }

    // Keep within viewport vertically
    if (top + popupHeight > window.innerHeight - padding) {
      top = window.innerHeight - popupHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    setPopupPosition({ left, top });
  }, [position]);

  const handlePlay = () => {
    if (detail?.level_slug) {
      router.push(`/play/${detail.level_slug}?questId=${q.id}`);
    } else {
      alert('This quest does not have a linked level yet.');
    }
  };

  // Difficulty badge colors
  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-600',
    medium: 'bg-yellow-600',
    hard: 'bg-orange-600',
    expert: 'bg-red-600',
  };

  return (
    <>
      {/* Backdrop to close on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Popup panel */}
      <div
        ref={popupRef}
        className="fixed w-[300px] bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl shadow-2xl border-2 border-amber-400 overflow-hidden z-50"
        style={{
          left: popupPosition.left,
          top: popupPosition.top,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title */}
        <div className="bg-gradient-to-r from-amber-300 to-amber-200 px-4 py-3 border-b-2 border-amber-400">
          <h3 className="font-bold text-gray-800 text-lg leading-tight">{q.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs text-white font-medium ${difficultyColors[q.difficulty] || 'bg-gray-600'}`}>
              {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
            </span>
            {q.level_requirement > 1 && (
              <span className="px-2 py-0.5 rounded text-xs bg-purple-600 text-white font-medium">
                Level {q.level_requirement}+
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Description */}
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">
            {q.description || 'Complete this challenge to progress on your coding journey.'}
          </p>

          {/* Rewards */}
          <div className="flex items-center gap-4 mb-4 bg-amber-200/50 rounded-lg p-2">
            <div className="flex items-center gap-1">
              <span className="text-lg">✨</span>
              <span className="text-gray-800 font-semibold">{q.xp_reward} XP</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🪙</span>
              <span className="text-gray-800 font-semibold">{q.coin_reward}</span>
            </div>
          </div>

          {/* Stars progress for completed */}
          {status === 'completed' && (
            <div className="flex items-center justify-between mb-4 bg-yellow-100 rounded-lg p-2">
              <div className="flex">
                {[1, 2, 3].map((star) => (
                  <span
                    key={star}
                    className="text-xl"
                    style={{
                      color: star <= stars_earned ? '#F59E0B' : '#D1D5DB',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              {detail?.best_action_count && (
                <span className="text-xs text-gray-600">
                  Best: {detail.best_action_count} moves
                </span>
              )}
            </div>
          )}

          {/* Play button */}
          {status === 'locked' ? (
            <div className="bg-gray-300 text-gray-500 py-3 rounded-lg text-center font-bold">
              🔒 Locked
            </div>
          ) : (
            <button
              onClick={handlePlay}
              className="w-full py-3 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
              style={{
                boxShadow: '0 4px 0 #166534, 0 6px 10px rgba(0,0,0,0.3)',
              }}
            >
              {status === 'completed' ? 'REPLAY' : 'PLAY'}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-lg font-bold shadow-md transition-colors"
          style={{ lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    </>
  );
}
