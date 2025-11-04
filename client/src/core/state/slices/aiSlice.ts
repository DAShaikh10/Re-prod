import type { StateCreator } from 'zustand';
import type { AIMessage } from '@shared/types';

export interface AIState {
  ai: {
    messages: AIMessage[];
    isLoading: boolean;
    suggestions: string[];
  };
  addAIMessage: (message: AIMessage) => void;
  setAILoading: (isLoading: boolean) => void;
  clearAIMessages: () => void;
  setAISuggestions: (suggestions: string[]) => void;
}

export const createAISlice: StateCreator<AIState> = (set) => ({
  ai: {
    messages: [],
    isLoading: false,
    suggestions: []
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
    }))
});
