import type { StateCreator } from 'zustand';
import type { AppSettings } from '@shared/types';

export interface SettingsState {
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoRun: false,
  theme: 'light',
  rPath: 'Rscript',
  fontSize: 13,
  showCellDecorations: true,
  highlightExecutingCell: true,
};

export const createSettingsSlice: StateCreator<SettingsState> = (set) => ({
  settings: { ...DEFAULT_SETTINGS },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }))
});
