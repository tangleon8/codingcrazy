'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, PlayerProgression, Character } from './api';
import { useAuth } from './auth-context';

interface ProgressionContextType {
  progression: PlayerProgression | null;
  characters: Character[];
  selectedCharacter: Character | null;
  isLoading: boolean;
  refreshProgression: () => Promise<void>;
  selectCharacter: (characterId: number) => Promise<void>;
  purchaseCharacter: (characterId: number) => Promise<void>;
}

const ProgressionContext = createContext<ProgressionContextType | undefined>(undefined);

export function ProgressionProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [progression, setProgression] = useState<PlayerProgression | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProgression = useCallback(async () => {
    if (!user) {
      setProgression(null);
      setCharacters([]);
      setIsLoading(false);
      return;
    }

    try {
      const [prog, chars] = await Promise.all([
        api.getProgression(),
        api.getCharacters(),
      ]);
      setProgression(prog);
      setCharacters(chars);
    } catch (error) {
      console.error('Failed to load progression:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      refreshProgression();
    }
  }, [authLoading, refreshProgression]);

  const selectCharacter = async (characterId: number) => {
    try {
      await api.selectCharacter(characterId);
      await refreshProgression();
    } catch (error) {
      console.error('Failed to select character:', error);
      throw error;
    }
  };

  const purchaseCharacter = async (characterId: number) => {
    try {
      await api.purchaseCharacter(characterId);
      await refreshProgression();
    } catch (error) {
      console.error('Failed to purchase character:', error);
      throw error;
    }
  };

  const selectedCharacter = characters.find((c) => c.is_selected) || null;

  return (
    <ProgressionContext.Provider
      value={{
        progression,
        characters,
        selectedCharacter,
        isLoading,
        refreshProgression,
        selectCharacter,
        purchaseCharacter,
      }}
    >
      {children}
    </ProgressionContext.Provider>
  );
}

export function useProgression() {
  const context = useContext(ProgressionContext);
  if (!context) {
    throw new Error('useProgression must be used within ProgressionProvider');
  }
  return context;
}
