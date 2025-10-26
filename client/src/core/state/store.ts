import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createEditorSlice, type EditorState } from './slices/editorSlice';
import { createExecutionSlice, type ExecutionState } from './slices/executionSlice';
import { createAISlice, type AIState } from './slices/aiSlice';
import { createSettingsSlice, type SettingsState } from './slices/settingsSlice';
import { createConnectionSlice, type ConnectionState } from './slices/connectionSlice';

export type StoreState = EditorState & ExecutionState & AIState & SettingsState & ConnectionState;

export const useStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createEditorSlice(...args),
      ...createExecutionSlice(...args),
      ...createAISlice(...args),
      ...createSettingsSlice(...args),
      ...createConnectionSlice(...args)
    }),
    { name: 'Re-prod Store' }
  )
);
