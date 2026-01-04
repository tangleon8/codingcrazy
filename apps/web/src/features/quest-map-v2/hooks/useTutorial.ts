'use client';

import { useState, useEffect, useCallback } from 'react';

const TUTORIAL_KEY = 'codingcrazy_tutorial_dismissed';

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  target: 'quest-node' | 'detail-panel' | 'start-button';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to the Forest!',
    description: 'Click on the first quest node to view its details. Each node represents a coding challenge!',
    target: 'quest-node',
  },
  {
    id: 2,
    title: 'Start Your Adventure',
    description: 'Press the Start Quest button to begin your coding challenge. Write code to guide your hero!',
    target: 'start-button',
  },
  {
    id: 3,
    title: 'Earn Rewards',
    description: 'Complete quests to earn XP and coins. Collect all coins for bonus stars and unlock the next quest!',
    target: 'detail-panel',
  },
];

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem(TUTORIAL_KEY);
    if (dismissed !== 'true') {
      setShowTutorial(true);
    }
    setIsInitialized(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step - dismiss tutorial
      setShowTutorial(false);
      localStorage.setItem(TUTORIAL_KEY, 'true');
    }
  }, [currentStep]);

  const dismiss = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_KEY, 'true');
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(TUTORIAL_KEY);
    setCurrentStep(0);
    setShowTutorial(true);
  }, []);

  return {
    showTutorial: isInitialized && showTutorial,
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    currentStepData: TUTORIAL_STEPS[currentStep],
    nextStep,
    dismiss,
    reset,
  };
}
