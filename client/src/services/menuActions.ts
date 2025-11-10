/**
 * Menu Actions Facade
 *
 * This file maps menu items to existing functionality.
 * NO new infrastructure - just thin wrappers around existing services.
 *
 * Design principle: Keep it simple. Direct function calls to existing
 * socketService and useStore methods.
 *
 * NOTE: Code execution actions are simplified. For full functionality
 * with cell metadata, use EditorPanel's buttons or shortcuts.
 */

import { useStore } from '@/core/state/store';
import type { ViewPane } from '@/core/state/slices/viewSlice';

/**
 * Menu Actions
 *
 * Organized by menu section (File, Edit, Code, Session, View, Help)
 */
export const menuActions = {
  // ===== FILE MENU =====
  file: {
    /**
     * Create new R script
     * Clears editor with confirmation if there are unsaved changes
     */
    new: () => {
      const store = useStore.getState();
      const isDirty = store.editor?.isDirty;

      if (isDirty) {
        if (!confirm('Discard unsaved changes?')) {
          return;
        }
      }

      // Reset editor state
      store.setEditorContent('# New R Script\n\n');
      store.setEditorFilepath('');
      store.setEditorIsDirty(false);
      console.log('New file created');
    },

    /**
     * Open file dialog
     * Browser file picker for .R and .Rmd files
     */
    open: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.R,.Rmd';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const content = await file.text();
          const store = useStore.getState();
          store.setEditorContent(content);
          store.setEditorFilepath(file.name);
          store.setEditorIsDirty(false);
          console.log(`Opened: ${file.name}`);
        } catch (error) {
          console.error(`Failed to open file: ${error}`);
        }
      };
      input.click();
    },

    /**
     * Save current file
     * Emits save-file socket event
     */
    save: () => {
      const store = useStore.getState();
      const { filepath, content } = store.editor || {};

      if (!filepath) {
        return menuActions.file.saveAs();
      }

      if (!content) {
        console.error('No content to save');
        return;
      }

      // Save file (simplified - no socket event for now)
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filepath;
      a.click();
      URL.revokeObjectURL(url);

      store.setEditorIsDirty(false);
      console.log('File saved');
    },

    /**
     * Save as new file
     * Browser download
     */
    saveAs: () => {
      const store = useStore.getState();
      const { content } = store.editor || {};

      if (!content) {
        console.error('No content to save');
        return;
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'untitled.R';
      a.click();
      URL.revokeObjectURL(url);

      console.log('File downloaded');
    },

    /**
     * Export reproducible session
     * Opens export dialog for RMarkdown/Bundle export
     */
    exportSession: () => {
      // Call global export dialog handler
      if (typeof (window as any).openExportDialog === 'function') {
        (window as any).openExportDialog();
      } else {
        console.error('Export dialog not initialized');
      }
    },
  },

  // ===== EDIT MENU =====
  edit: {
    // These delegate to Monaco editor
    undo: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'undo', null);
      }
    },

    redo: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'redo', null);
      }
    },

    cut: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.clipboardCutAction', null);
      }
    },

    copy: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.clipboardCopyAction', null);
      }
    },

    paste: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.clipboardPasteAction', null);
      }
    },

    find: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'actions.find', null);
      }
    },

    replace: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.startFindReplaceAction', null);
      }
    },

    /**
     * Focus AI Assistant panel
     * Most important menu action - Cmd+K
     */
    aiAssist: () => {
      // Focus AI panel input
      setTimeout(() => {
        const aiInput = document.querySelector('.ai-input') as HTMLTextAreaElement;
        if (aiInput) {
          aiInput.focus();
        }
      }, 100);
    },
  },

  // ===== CODE MENU =====
  code: {
    /**
     * Run selected code or current line
     * Delegates to EditorPanel's handleRunCurrentCell for full functionality
     */
    runSelection: () => {
      const runCurrentCell = useStore.getState().runCurrentCell;
      if (runCurrentCell) {
        runCurrentCell();
      } else {
        console.error('Code execution not available: EditorPanel not mounted');
      }
    },

    /**
     * Run all code in editor
     * Delegates to EditorPanel's handleRunAll for full functionality
     */
    runAll: () => {
      const runAll = useStore.getState().runAll;
      if (runAll) {
        runAll();
      } else {
        console.error('Code execution not available: EditorPanel not mounted');
      }
    },

    /**
     * Source file in clean environment
     * Same as runAll (executes whole document)
     */
    sourceFile: () => {
      const runAll = useStore.getState().runAll;
      if (runAll) {
        runAll();
      } else {
        console.error('Code execution not available: EditorPanel not mounted');
      }
    },

    /**
     * Interrupt running R execution
     */
    interrupt: () => {
      console.info('Interrupt not yet implemented');
      // TODO: Implement execution interrupt
    },

    /**
     * Restart R session
     * Clears workspace and restarts R process
     */
    restartSession: () => {
      if (!confirm('Restart R session? All workspace variables will be lost.')) {
        return;
      }

      console.info('Restart session not yet implemented');
      // TODO: Implement session restart
    },

    /**
     * Comment/uncomment selected lines
     */
    comment: () => {
      const editor = useStore.getState().monacoEditor;
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.commentLine', null);
      }
    },
  },

  // ===== SESSION MENU =====
  session: {
    /**
     * Show timeline panel
     */
    showTimeline: () => {
      // Scroll to timeline panel
      setTimeout(() => {
        const timelineEl = document.querySelector('.timeline-panel');
        timelineEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    },

    /**
     * Export reproducible package
     */
    exportReproducible: () => {
      // Same as file:exportSession
      menuActions.file.exportSession();
    },

    /**
     * Start new session
     */
    new: () => {
      if (!confirm('Start new session? Unsaved work will be lost.')) {
        return;
      }

      window.location.reload();
    },

    /**
     * Save session
     * TODO: Implement session persistence
     */
    save: () => {
      console.info('Session save not yet implemented');
    },

    /**
     * Load session
     * TODO: Implement session loading
     */
    load: () => {
      console.info('Session load not yet implemented');
    },

    /**
     * Show session info
     */
    info: () => {
      console.info('Session info not yet implemented');
      // TODO: Implement session info modal
    },

    /**
     * Open settings
     * TODO: Implement settings modal
     */
    settings: () => {
      console.info('Settings not yet implemented');
    },
  },

  // ===== VIEW MENU =====
  view: {
    /**
     * Toggle pane visibility
     */
    togglePane: (paneId: string) => {
      const pane = paneId as ViewPane;
      const { togglePaneVisibility } = useStore.getState();
      togglePaneVisibility(pane);
      const next = useStore.getState().view.panes[pane];
      console.log(`${paneId} ${next ? 'shown' : 'hidden'}`);
    },

    /**
     * Zoom in
     */
    zoomIn: () => {
      const { adjustZoom } = useStore.getState();
      adjustZoom(0.1);
      const { view } = useStore.getState();
      console.log(`Zoom: ${Math.round(view.zoom * 100)}%`);
    },

    /**
     * Zoom out
     */
    zoomOut: () => {
      const { adjustZoom } = useStore.getState();
      adjustZoom(-0.1);
      const { view } = useStore.getState();
      console.log(`Zoom: ${Math.round(view.zoom * 100)}%`);
    },

    /**
     * Reset zoom to 100%
     */
    zoomReset: () => {
      const { resetZoom } = useStore.getState();
      resetZoom();
      const next = useStore.getState().view.zoom;
      const rounded = Math.round(next * 100);
      console.log(rounded === 100 ? 'Zoom reset to 100%' : `Zoom: ${rounded}%`);
    },
  },

  // ===== HELP MENU =====
  help: {
    /**
     * Open documentation in new tab
     */
    docs: () => {
      window.open('https://reprod.dev/docs', '_blank');
    },

    /**
     * Show keyboard shortcuts modal
     * TODO: Implement shortcuts modal
     */
    shortcuts: () => {
      console.info('Shortcuts modal not yet implemented');
    },

    /**
     * Open GitHub issues page
     */
    reportIssue: () => {
      window.open('https://github.com/reprod/issues/new', '_blank');
    },

    /**
     * Show about modal
     * TODO: Implement about modal
     */
    about: () => {
      console.info('About modal not yet implemented');
    },
  },
};
