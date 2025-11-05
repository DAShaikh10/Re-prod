/**
 * Menu Actions Facade
 *
 * This file maps menu items to existing functionality.
 * NO new infrastructure - just thin wrappers around existing services.
 *
 * Design principle: Keep it simple. Direct function calls to existing
 * socketService and useStore methods.
 */

import { socketService } from './socket';
import { useStore } from '@/core/state/store';

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
     * Triggers backend export with timeline
     */
    exportSession: () => {
      console.info('Export session not yet implemented');
      // TODO: Implement session export with timeline
    },
  },

  // ===== EDIT MENU =====
  edit: {
    // These delegate to Monaco editor
    undo: (editor: any) => {
      if (editor?.trigger) {
        editor.trigger('menu', 'undo', null);
      }
    },

    redo: (editor: any) => {
      if (editor?.trigger) {
        editor.trigger('menu', 'redo', null);
      }
    },

    cut: (editor: any) => {
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.clipboardCutAction', null);
      }
    },

    copy: (editor: any) => {
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.clipboardCopyAction', null);
      }
    },

    paste: (editor: any) => {
      if (editor?.trigger) {
        editor.trigger('menu', 'editor.action.clipboardPasteAction', null);
      }
    },

    find: (editor: any) => {
      if (editor?.trigger) {
        editor.trigger('menu', 'actions.find', null);
      }
    },

    replace: (editor: any) => {
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
     */
    runSelection: (editor: any) => {
      if (!editor) return;

      const selection = editor.getSelection();
      let code: string;

      if (selection && !selection.isEmpty()) {
        // Run selected code
        code = editor.getModel().getValueInRange(selection);
      } else {
        // Run current line
        const position = editor.getPosition();
        code = editor.getModel().getLineContent(position.lineNumber);
      }

      if (!code.trim()) {
        console.error('No code to execute');
        return;
      }

      socketService.send({
        type: 'execute',
        request: {
          code,
          context: {
            source: 'selection',
            triggered_at_ms: Date.now(),
            actor: 'user' as const,
          },
          blocks: [],
        },
      });

      console.log('Code executing...');
    },

    /**
     * Run all code in editor
     */
    runAll: (editor: any) => {
      if (!editor) return;

      const code = editor.getValue();
      if (!code.trim()) {
        console.error('No code to execute');
        return;
      }

      socketService.send({
        type: 'execute',
        request: {
          code,
          context: {
            source: 'whole_document',
            triggered_at_ms: Date.now(),
            actor: 'user' as const,
          },
          blocks: [],
        },
      });

      console.log('Running all code...');
    },

    /**
     * Source file in clean environment
     */
    sourceFile: (editor: any) => {
      if (!editor) return;

      const code = editor.getValue();
      if (!code.trim()) {
        console.error('No code to source');
        return;
      }

      socketService.send({
        type: 'execute',
        request: {
          code,
          context: {
            source: 'whole_document',
            triggered_at_ms: Date.now(),
            actor: 'user' as const,
          },
          blocks: [],
        },
      });

      console.log('Sourcing file...');
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
    comment: (editor: any) => {
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
      // Toggle pane visibility via DOM
      const pane = document.querySelector(`.${paneId}-panel`);
      if (pane) {
        const isVisible = pane.classList.contains('hidden');
        pane.classList.toggle('hidden');
        console.log(`${paneId} ${isVisible ? 'shown' : 'hidden'}`);
      }
    },

    /**
     * Zoom in
     */
    zoomIn: () => {
      const currentZoom = parseFloat(document.documentElement.style.getPropertyValue('--zoom-level') || '1.0');
      const newZoom = Math.min(2.0, currentZoom + 0.1);
      document.documentElement.style.setProperty('--zoom-level', String(newZoom));
      console.log(`Zoom: ${Math.round(newZoom * 100)}%`);
    },

    /**
     * Zoom out
     */
    zoomOut: () => {
      const currentZoom = parseFloat(document.documentElement.style.getPropertyValue('--zoom-level') || '1.0');
      const newZoom = Math.max(0.5, currentZoom - 0.1);
      document.documentElement.style.setProperty('--zoom-level', String(newZoom));
      console.log(`Zoom: ${Math.round(newZoom * 100)}%`);
    },

    /**
     * Reset zoom to 100%
     */
    zoomReset: () => {
      document.documentElement.style.setProperty('--zoom-level', '1');
      console.log('Zoom reset to 100%');
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
