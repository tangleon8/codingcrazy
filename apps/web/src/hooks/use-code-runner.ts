'use client';

import { useCallback, useRef } from 'react';
import { Action } from '@codingcrazy/engine';

export interface CodeRunnerResult {
  actions: Action[];
  consoleOutput: string[];
  error?: string;
}

interface WorkerMessage {
  actions: Action[];
  consoleOutput: string[];
  error: string | null;
}

export function useCodeRunner() {
  const workerRef = useRef<Worker | null>(null);

  const runCode = useCallback(
    async (
      code: string,
      allowedMethods: string[],
      options: { timeout?: number; maxActions?: number } = {}
    ): Promise<CodeRunnerResult> => {
      const { timeout = 2000, maxActions = 200 } = options;

      return new Promise((resolve) => {
        // Terminate any existing worker
        if (workerRef.current) {
          workerRef.current.terminate();
        }

        // Create a new worker
        const worker = new Worker('/sandbox-worker.js');
        workerRef.current = worker;

        // Set up timeout for worker
        const timeoutId = setTimeout(() => {
          worker.terminate();
          resolve({
            actions: [],
            consoleOutput: [],
            error: 'Code execution timed out!',
          });
        }, timeout + 1000); // Extra buffer for worker overhead

        // Handle worker response
        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          clearTimeout(timeoutId);
          worker.terminate();
          workerRef.current = null;

          const { actions, consoleOutput, error } = e.data;
          resolve({
            actions,
            consoleOutput,
            error: error || undefined,
          });
        };

        // Handle worker errors
        worker.onerror = (e) => {
          clearTimeout(timeoutId);
          worker.terminate();
          workerRef.current = null;

          resolve({
            actions: [],
            consoleOutput: [],
            error: e.message || 'Worker error occurred',
          });
        };

        // Send code to worker
        worker.postMessage({
          code,
          allowedMethods,
          timeout,
          maxActions,
        });
      });
    },
    []
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return { runCode, terminate };
}
