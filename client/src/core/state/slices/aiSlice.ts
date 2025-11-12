import type { StateCreator } from 'zustand';
import type { AIMessage } from '@shared/types';

export interface PatchMatchStatus {
  lastFailureId: string | null;
  lastFailureReason: string | null;
}

export interface AIState {
  ai: {
    messages: AIMessage[];
    isLoading: boolean;
    suggestions: string[];
    patchMatchFailures: number;
    patchMatchStatus: PatchMatchStatus;
  };
  addAIMessage: (message: AIMessage) => void;
  setAILoading: (isLoading: boolean) => void;
  clearAIMessages: () => void;
  setAISuggestions: (suggestions: string[]) => void;
  recordPatchMatchFailure: (reason: string, id: string) => void;
  recordPatchMatchSuccess: () => void;
}

export const createAISlice: StateCreator<AIState> = (set) => ({
  ai: {
    messages: [],
    isLoading: false,
    suggestions: [],
    patchMatchFailures: 0,
    patchMatchStatus: { lastFailureId: null, lastFailureReason: null },
  },
  addAIMessage: (message) =>
    set((state) => ({
      ai: { ...state.ai, messages: [...state.ai.messages, message] }
    })),
  setAILoading: (isLoading) =>
    set((state) => ({
      ai: { ...state.ai, isLoading }
    })),
  clearAIMessages: () =>
    set((state) => ({
      ai: { ...state.ai, messages: [] }
    })),
  setAISuggestions: (suggestions) =>
    set((state) => ({
      ai: { ...state.ai, suggestions }
    })),
  recordPatchMatchFailure: (reason, id) =>
    set((state) => ({
      ai: {
        ...state.ai,
        patchMatchFailures: state.ai.patchMatchFailures + 1,
        patchMatchStatus: {
          lastFailureId: id,
          lastFailureReason: reason,
        },
      },
    })),
  recordPatchMatchSuccess: () =>
    set((state) => ({
      ai: {
        ...state.ai,
        patchMatchStatus: { lastFailureId: null, lastFailureReason: null },
      },
    })),
});
