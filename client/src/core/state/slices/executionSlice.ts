import type { StateCreator } from 'zustand';
import type { ExecutionResult } from '../../../../../shared/src/types';

export interface ExecutionState {
  execution: {
    isRunning: boolean;
    results: ExecutionResult[];
    history: ExecutionResult[];
    currentCell: number | undefined;
  };
  setIsRunning: (isRunning: boolean) => void;
  addExecutionResult: (result: ExecutionResult) => void;
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
