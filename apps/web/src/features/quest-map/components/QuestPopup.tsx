'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { QuestMapItem, api, QuestDetailResponse } from '@/lib/api';

interface QuestPopupProps {
  quest: QuestMapItem;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function QuestPopup({ quest, position, onClose }: QuestPopupProps) {
  const router = useRouter();
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
    const popupWidth = 320;
    const popupHeight = 380;

    let left = position.x + 50;
    let top = position.y - 80;

    // Keep within viewport horizontally
    if (left + popupWidth > window.innerWidth - padding) {
      left = position.x - popupWidth - 50;
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
  const difficultyConfig: Record<string, { bg: string; text: string }> = {
    easy: { bg: '#16A34A', text: '#DCFCE7' },
    medium: { bg: '#CA8A04', text: '#FEF9C3' },
    hard: { bg: '#EA580C', text: '#FFEDD5' },
    expert: { bg: '#DC2626', text: '#FEE2E2' },
  };

  const difficulty = difficultyConfig[q.difficulty] || { bg: '#6B7280', text: '#F3F4F6' };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div
        className="fixed z-50 w-80 rounded-xl overflow-hidden"
        style={{
          left: popupPosition.left,
          top: popupPosition.top,
          background: 'linear-gradient(180deg, #FDF6E3 0%, #F5E6C8 100%)',
          border: '3px solid #B8860B',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3"
          style={{
            background: 'linear-gradient(180deg, #D4A84B 0%, #B8860B 100%)',
            borderBottom: '2px solid #8B6914',
          }}
        >
          <h3 className="font-bold text-lg text-white drop-shadow-md">{q.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: difficulty.bg, color: difficulty.text }}
            >
              {q.difficulty.toUpperCase()}
            </span>
            {q.level_requirement > 1 && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-600 text-purple-100">
                LVL {q.level_requirement}+
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Description */}
          <p className="text-gray-800 text-sm mb-4 leading-relaxed">
            {q.description || 'Complete this challenge to progress on your coding journey.'}
          </p>

          {/* Rewards Box */}
          <div
            className="rounded-lg p-3 mb-4"
            style={{
              background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)',
              border: '2px solid #D97706',
            }}
          >
            <div className="text-xs font-bold text-amber-800 mb-2">REWARDS</div>
            <div className="flex items-center justify-around">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="text-purple-700 font-bold text-lg">{q.xp_reward}</div>
                  <div className="text-purple-600 text-xs">XP</div>
                </div>
              </div>
              <div className="w-px h-8 bg-amber-300" />
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <div>
                  <div className="text-yellow-700 font-bold text-lg">{q.coin_reward}</div>
                  <div className="text-yellow-600 text-xs">COINS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stars (for completed) */}
          {status === 'completed' && (
            <div
              className="rounded-lg p-3 mb-4 flex items-center justify-between"
              style={{
                background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '2px solid #F59E0B',
              }}
            >
              <div className="flex gap-1">
                {[1, 2, 3].map((star) => (
                  <span
                    key={star}
                    className="text-2xl"
                    style={{
                      color: star <= stars_earned ? '#F59E0B' : '#D1D5DB',
                      filter: star <= stars_earned ? 'drop-shadow(0 0 4px #F59E0B)' : 'none',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              {detail?.best_action_count && (
                <div className="text-right">
                  <div className="text-amber-800 font-bold">{detail.best_action_count}</div>
                  <div className="text-amber-600 text-xs">BEST MOVES</div>
                </div>
              )}
            </div>
          )}

          {/* Play Button */}
          {status === 'locked' ? (
            <div
              className="py-3 rounded-lg text-center font-bold"
              style={{
                background: '#9CA3AF',
                color: '#4B5563',
              }}
            >
              🔒 LOCKED
            </div>
          ) : (
            <button
              onClick={handlePlay}
              className="w-full py-3 rounded-lg font-bold text-lg text-white transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
                boxShadow: '0 4px 0 #15803D, 0 6px 12px rgba(0,0,0,0.2)',
                border: '2px solid #4ADE80',
              }}
            >
              {status === 'completed' ? '▶ REPLAY' : '▶ PLAY'}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
          style={{
            background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            border: '2px solid #FCA5A5',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          ×
        </button>
      </div>
    </>
  );
}
