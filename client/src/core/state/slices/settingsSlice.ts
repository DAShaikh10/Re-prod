import type { StateCreator } from 'zustand';
import type { AppSettings } from '@shared/types';

export interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const createSettingsSlice: StateCreator<SettingsState> = (set) => ({
  settings: {
    autoRun: false,
    theme: 'light',
    rPath: 'Rscript',
    fontSize: 13,
    showCellDecorations: true,
    highlightExecutingCell: true
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }))
});
