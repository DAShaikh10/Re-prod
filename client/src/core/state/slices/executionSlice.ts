import type { StateCreator } from 'zustand';
import type { ExecutionLogEntry } from '@shared/types';

export interface ExecutionState {
  execution: {
    isRunning: boolean;
    results: ExecutionLogEntry[];
    history: ExecutionLogEntry[];
    currentCell: number | undefined;
  };
  setIsRunning: (isRunning: boolean) => void;
  addExecutionResult: (result: ExecutionLogEntry) => void;
  clearExecutionResults: () => void;
  setCurrentCell: (cellIndex: number | undefined) => void;
}

export const createExecutionSlice: StateCreator<ExecutionState> = (set) => ({
  execution: {
    isRunning: false,
    results: [],
    history: [],
    currentCell: undefined
  },
  setIsRunning: (isRunning) =>
    set((state) => ({
      execution: { ...state.execution, isRunning }
    })),
  addExecutionResult: (result) =>
    set((state) => ({
      execution: {
        ...state.execution,
        results: [...state.execution.results, result],
        history: [...state.execution.history, result]
      }
    })),
  clearExecutionResults: () =>
    set((state) => ({
      execution: { ...state.execution, results: [] }
    })),
  setCurrentCell: (currentCell) =>
    set((state) => ({
      execution: { ...state.execution, currentCell }
    }))
});
