'use client';

import { TutorialStep } from '../hooks/useTutorial';

interface TutorialOverlayProps {
  currentStep: number;
  totalSteps: number;
  stepData: TutorialStep;
  onNext: () => void;
  onDismiss: () => void;
}

export default function TutorialOverlay({
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onDismiss,
}: TutorialOverlayProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onDismiss}
      />

      {/* Tutorial card - centered */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '420px',
          width: '90%',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
            border: '3px solid #374151',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Header with step indicator */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
              borderBottom: '2px solid #22C55E',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {currentStep === 0 && '🌲'}
                {currentStep === 1 && '🎮'}
                {currentStep === 2 && '✨'}
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">{stepData.title}</h2>
                <span className="text-xs text-green-300">
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
            </div>

            {/* Skip button */}
            <button
              onClick={onDismiss}
              className="text-green-300 hover:text-white transition-colors text-sm cursor-pointer"
              style={{ position: 'relative', zIndex: 10 }}
            >
              Skip
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-gray-300 leading-relaxed">
              {stepData.description}
            </p>

            {/* Visual hint based on step */}
            <div
              className="mt-4 p-3 rounded-lg flex items-center gap-3"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <span className="text-xl">
                {currentStep === 0 && '👆'}
                {currentStep === 1 && '▶️'}
                {currentStep === 2 && '🏆'}
              </span>
              <span className="text-sm text-green-400">
                {currentStep === 0 && 'Look for the "Start Here" marker on the map'}
                {currentStep === 1 && 'The green button starts the quest'}
                {currentStep === 2 && 'Completing quests unlocks new challenges'}
              </span>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2 mt-5">
              {[...Array(totalSteps)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{
                    background: i === currentStep ? '#22C55E' : '#4B5563',
                    boxShadow: i === currentStep ? '0 0 6px #22C55E' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Footer with action button */}
          <div
            className="px-6 py-4"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderTop: '1px solid #374151',
            }}
          >
            <button
              onClick={onNext}
              className="w-full py-3 rounded-lg font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
                boxShadow: '0 4px 0 #15803D, 0 6px 12px rgba(0,0,0,0.3)',
                border: '2px solid #4ADE80',
                position: 'relative',
                zIndex: 10,
              }}
            >
              {isLastStep ? "Got it! Let's Go!" : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
