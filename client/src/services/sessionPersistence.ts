import type { ExecutionLogEntry, AppSettings } from '@shared/types';
import { useStore } from '@/core';

const SNAPSHOT_VERSION = 1;
const STORAGE_FILENAME = () =>
  `reprod-session-${new Date().toISOString().replace(/[:]/g, '-')}.json`;

interface SessionSnapshot {
  version: number;
  savedAt: number;
  editor: {
    content: string;
    filepath: string;
  };
  executionHistory: ExecutionLogEntry[];
  settings: AppSettings;
}

export function exportSessionSnapshot(): void {
  const state = useStore.getState();
  const snapshot: SessionSnapshot = {
    version: SNAPSHOT_VERSION,
    savedAt: Date.now(),
    editor: {
      content: state.editor.content,
      filepath: state.editor.filepath,
    },
    executionHistory: state.execution.history,
    settings: state.settings,
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = STORAGE_FILENAME();
  link.click();
  URL.revokeObjectURL(url);
}

export function importSessionSnapshot(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as SessionSnapshot;
      applySnapshot(data);
    } catch (error) {
      console.error('Failed to load session snapshot', error);
      window.alert('Unable to load session snapshot. Ensure the file is valid JSON.');
    }
  };

  input.click();
}

function applySnapshot(snapshot: SessionSnapshot): void {
  if (snapshot.version !== SNAPSHOT_VERSION) {
    window.alert('Session snapshot version is not compatible with this build.');
    return;
  }

  const state = useStore.getState();
  state.setEditorContent(snapshot.editor.content);
  state.setEditorFilepath(snapshot.editor.filepath);
  state.setEditorIsDirty(false);
  state.loadExecutionHistory(snapshot.executionHistory ?? []);
  state.updateSettings(snapshot.settings);
}
