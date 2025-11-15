import { useMemo, useState } from 'react';
import { IconKeyboard } from '@/components/shared';
import { ModalShell } from './ModalShell';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  id: string;
  keys: string[];
  description: string;
  scope?: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    items: [
      { id: 'file-new', keys: ['⌘N', 'Ctrl+N'], description: 'New R script' },
      { id: 'file-open', keys: ['⌘O', 'Ctrl+O'], description: 'Open existing file' },
      { id: 'file-save', keys: ['⌘S', 'Ctrl+S'], description: 'Save current file' },
      { id: 'file-save-as', keys: ['⌘⇧S', 'Ctrl+Shift+S'], description: 'Save as new file' },
      { id: 'settings', keys: ['⌘,', 'Ctrl+,'], description: 'Open settings' },
      { id: 'ai', keys: ['⌘K', 'Ctrl+K'], description: 'Focus AI Assistant' },
    ],
  },
  {
    title: 'Code Execution',
    items: [
      { id: 'run-selection', keys: ['⌘↵', 'Ctrl+Enter'], description: 'Run current line or selection', scope: 'Editor' },
      { id: 'run-next', keys: ['Shift+Enter'], description: 'Run cell and move to next', scope: 'Editor' },
      { id: 'run-all', keys: ['⌘⇧↵', 'Ctrl+Shift+Enter'], description: 'Run entire document', scope: 'Editor' },
      { id: 'interrupt', keys: ['Esc'], description: 'Interrupt running code' },
      { id: 'restart', keys: ['⌘⇧0', 'Ctrl+Shift+0'], description: 'Restart R session' },
    ],
  },
  {
    title: 'Session & Navigation',
    items: [
      { id: 'timeline', keys: ['⌘T', 'Ctrl+T'], description: 'Open timeline' },
      { id: 'new-session', keys: ['⌘⇧N', 'Ctrl+Shift+N'], description: 'Start new session' },
      { id: 'toggle-editor', keys: ['⌘1', 'Ctrl+1'], description: 'Show or hide editor' },
      { id: 'toggle-console', keys: ['⌘2', 'Ctrl+2'], description: 'Show or hide console' },
      { id: 'toggle-plots', keys: ['⌘3', 'Ctrl+3'], description: 'Show or hide plots' },
      { id: 'toggle-timeline', keys: ['⌘4', 'Ctrl+4'], description: 'Toggle timeline tab' },
    ],
  },
  {
    title: 'View & Editing',
    items: [
      { id: 'comment', keys: ['⌘/', 'Ctrl+/'], description: 'Comment or uncomment selection', scope: 'Editor' },
      { id: 'find', keys: ['⌘F', 'Ctrl+F'], description: 'Find in editor', scope: 'Editor' },
      { id: 'replace', keys: ['⌘H', 'Ctrl+H'], description: 'Find and replace', scope: 'Editor' },
      { id: 'zoom-in', keys: ['⌘+', 'Ctrl++'], description: 'Zoom in' },
      { id: 'zoom-out', keys: ['⌘-', 'Ctrl+-'], description: 'Zoom out' },
      { id: 'zoom-reset', keys: ['⌘0', 'Ctrl+0'], description: 'Reset zoom' },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps): JSX.Element | null {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return SHORTCUT_GROUPS;
    }

    return SHORTCUT_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        `${item.keys.join(' ')} ${item.description}`.toLowerCase().includes(normalizedQuery)
      ),
    })).filter((group) => group.items.length > 0);
  }, [normalizedQuery]);

  return (
    <ModalShell
      open={open}
      onClose={() => {
        setQuery('');
        onClose();
      }}
      title="Keyboard Shortcuts"
      subtitle="Stay in flow with quick commands"
      icon={<IconKeyboard width={24} height={24} aria-hidden />}
      maxWidth={760}
    >
      <div className="shortcuts-search">
        <input
          type="search"
          placeholder="Filter shortcuts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter shortcuts"
        />
      </div>
      <div className="shortcuts-grid">
        {filteredGroups.map((group) => (
          <div key={group.title} className="shortcut-group">
            <div className="shortcut-group-header">{group.title}</div>
            {group.items.map((item) => (
              <div key={item.id} className="shortcut-card">
                <div className="shortcut-keys">
                  {item.keys.map((combo) => (
                    <span key={`${item.id}-${combo}`} className="keycap">
                      {combo}
                    </span>
                  ))}
                </div>
                <div className="shortcut-details">
                  <span className="shortcut-description">{item.description}</span>
                  {item.scope && <span className="shortcut-scope">{item.scope}</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="shortcuts-empty">
            No shortcuts match “{query}”. Try a different search.
          </div>
        )}
      </div>
    </ModalShell>
  );
}
