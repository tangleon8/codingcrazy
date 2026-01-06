'use client';

import { useState, useEffect, useCallback } from 'react';
import { LEVEL_1_QUESTS, Quest } from '../data/level1Quests';
import { LEVEL_2_QUESTS } from '../data/level2Quests';

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
      const parsed = JSON.parse(stored);
      // Handle both array format and old object format
      if (Array.isArray(parsed)) {
        return new Map(parsed.map((p: QuestProgress) => [p.questId, p]));
      }
      // Old format was {questId: {completed, starsEarned}}
      if (typeof parsed === 'object') {
        const entries = Object.entries(parsed).map(([id, data]) => {
          const questId = parseInt(id);
          const progress = data as { completed?: boolean; starsEarned?: number; completedAt?: string };
          return [questId, {
            questId,
            completed: progress.completed || false,
            starsEarned: progress.starsEarned || 0,
            completedAt: progress.completedAt,
          }] as [number, QuestProgress];
        });
        return new Map(entries);
      }
    }
  } catch (e) {
    console.error('Failed to load quest progress:', e);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore if we can't clear
    }
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

export function useQuestProgress(level: 1 | 2 = 1) {
  const [progress, setProgress] = useState<Map<number, QuestProgress>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Select quests based on level
  const QUESTS = level === 1 ? LEVEL_1_QUESTS : LEVEL_2_QUESTS;

  // Load progress from localStorage on mount
  useEffect(() => {
    setProgress(getStoredProgress());
    setIsLoaded(true);
  }, []);

  // Get status for a quest
  const getQuestStatus = useCallback((questId: number): QuestStatus => {
    const questIndex = QUESTS.findIndex(q => q.id === questId);
    if (questIndex === -1) return 'locked';

    // Level 2 Quest 11 requires Level 1 Quest 10 to be completed
    if (level === 2 && questIndex === 0) {
      const level1Complete = progress.get(10)?.completed;
      if (!level1Complete) {
        return 'locked';
      }
      const questProgress = progress.get(questId);
      return questProgress?.completed ? 'completed' : 'unlocked';
    }

    // First quest of level is unlocked (Level 1 Quest 1)
    if (questIndex === 0) {
      const questProgress = progress.get(questId);
      return questProgress?.completed ? 'completed' : 'unlocked';
    }

    // Check if previous quest is completed
    const previousQuest = QUESTS[questIndex - 1];
    const previousProgress = progress.get(previousQuest.id);

    if (!previousProgress?.completed) {
      return 'locked';
    }

    const questProgress = progress.get(questId);
    return questProgress?.completed ? 'completed' : 'unlocked';
  }, [progress, QUESTS, level]);

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
  const questsWithStatus: QuestWithStatus[] = QUESTS.map(quest => ({
    ...quest,
    status: getQuestStatus(quest.id),
    starsEarned: getStarsEarned(quest.id),
  }));

  // Get completion stats
  const completedCount = questsWithStatus.filter(q => q.status === 'completed').length;
  const totalCount = QUESTS.length;
  const totalStars = questsWithStatus.reduce((sum, q) => sum + q.starsEarned, 0);
  const maxStars = totalCount * 3;

  // Check if level 1 is complete (for level switching UI)
  const isLevel1Complete = progress.get(10)?.completed || false;

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
    isLevel1Complete,
    getQuestStatus,
    getStarsEarned,
    completeQuest,
    setStars,
    resetProgress,
  };
}
