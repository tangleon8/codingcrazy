'use client';

import { useState, useEffect, useCallback } from 'react';
import { LEVEL_1_QUESTS, Quest } from '../data/level1Quests';

const STORAGE_KEY = 'codingcrazy_quest_progress';

export type QuestStatus = 'locked' | 'unlocked' | 'completed';

export interface QuestProgress {
  questId: number;
  completed: boolean;
  starsEarned: number; // 0-3
  completedAt?: string;
}

export interface QuestWithStatus extends Quest {
  status: QuestStatus;
  starsEarned: number;
}

function getStoredProgress(): Map<number, QuestProgress> {
  if (typeof window === 'undefined') return new Map();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as QuestProgress[];
      return new Map(parsed.map(p => [p.questId, p]));
    }
  } catch (e) {
    console.error('Failed to load quest progress:', e);
  }
  return new Map();
}

function saveProgress(progress: Map<number, QuestProgress>) {
  if (typeof window === 'undefined') return;

  try {
    const arr = Array.from(progress.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Failed to save quest progress:', e);
  }
}

export function useQuestProgress() {
  const [progress, setProgress] = useState<Map<number, QuestProgress>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    setProgress(getStoredProgress());
    setIsLoaded(true);
  }, []);

  // Get status for a quest
  const getQuestStatus = useCallback((questId: number): QuestStatus => {
    const questIndex = LEVEL_1_QUESTS.findIndex(q => q.id === questId);
    if (questIndex === -1) return 'locked';

    // Quest 1 is always unlocked
    if (questIndex === 0) {
      const questProgress = progress.get(questId);
      return questProgress?.completed ? 'completed' : 'unlocked';
    }

    // Check if previous quest is completed
    const previousQuest = LEVEL_1_QUESTS[questIndex - 1];
    const previousProgress = progress.get(previousQuest.id);

    if (!previousProgress?.completed) {
      return 'locked';
    }

    const questProgress = progress.get(questId);
    return questProgress?.completed ? 'completed' : 'unlocked';
  }, [progress]);

  // Get stars for a quest
  const getStarsEarned = useCallback((questId: number): number => {
    return progress.get(questId)?.starsEarned || 0;
  }, [progress]);

  // Mark quest as complete
  const completeQuest = useCallback((questId: number, stars: number = 1) => {
    setProgress(prev => {
      const newProgress = new Map(prev);
      const existing = newProgress.get(questId);

      // Only update if new stars are higher
      const newStars = Math.max(existing?.starsEarned || 0, Math.min(3, Math.max(1, stars)));

      newProgress.set(questId, {
        questId,
        completed: true,
        starsEarned: newStars,
        completedAt: new Date().toISOString(),
      });

      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  // Set stars for a quest (for testing)
  const setStars = useCallback((questId: number, stars: number) => {
    setProgress(prev => {
      const newProgress = new Map(prev);
      const existing = newProgress.get(questId);

      if (existing?.completed) {
        newProgress.set(questId, {
          ...existing,
          starsEarned: Math.min(3, Math.max(0, stars)),
        });
        saveProgress(newProgress);
      }

      return newProgress;
    });
  }, []);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setProgress(new Map());
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Get all quests with their status
  const questsWithStatus: QuestWithStatus[] = LEVEL_1_QUESTS.map(quest => ({
    ...quest,
    status: getQuestStatus(quest.id),
    starsEarned: getStarsEarned(quest.id),
  }));

  // Get completion stats
  const completedCount = questsWithStatus.filter(q => q.status === 'completed').length;
  const totalCount = LEVEL_1_QUESTS.length;
  const totalStars = questsWithStatus.reduce((sum, q) => sum + q.starsEarned, 0);
  const maxStars = totalCount * 3;

  // Find current quest (first unlocked)
  const currentQuest = questsWithStatus.find(q => q.status === 'unlocked')
    || questsWithStatus[questsWithStatus.length - 1];

  return {
    quests: questsWithStatus,
    isLoaded,
    completedCount,
    totalCount,
    totalStars,
    maxStars,
    currentQuest,
    getQuestStatus,
    getStarsEarned,
    completeQuest,
    setStars,
    resetProgress,
  };
}
