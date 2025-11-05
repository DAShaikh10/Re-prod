/**
 * MenuBar Component
 *
 * Main menu bar with 6 sections: File, Edit, Code, Session, View, Help
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useStore } from '@/core/state/store';
import { menuActions } from '@/services/menuActions';
import { type MenuSection, type MenuItem } from '@/types/menu';

// Menu sections definition
const menuSections: MenuSection[] = [
  {
    label: 'File',
    items: [
      { id: 'file:new', label: 'New R Script', shortcut: '⌘N', action: () => menuActions.file.new() },
      { id: 'file:open', label: 'Open...', shortcut: '⌘O', action: () => menuActions.file.open() },
      { type: 'separator' },
      {
        id: 'file:save',
        label: 'Save',
        shortcut: '⌘S',
        action: () => menuActions.file.save(),
        enabled: () => {
          const store = useStore.getState();
          return store.editor?.isDirty ?? false;
        },
      },
      { id: 'file:save-as', label: 'Save As...', shortcut: '⌘⇧S', action: () => menuActions.file.saveAs() },
      { type: 'separator' },
      { id: 'file:export-session', label: 'Export Reproducible Session...', action: () => menuActions.file.exportSession() },
    ],
  },
  {
    label: 'Edit',
    items: [
      { id: 'edit:undo', label: 'Undo', shortcut: '⌘Z', action: () => menuActions.edit.undo() },
      { id: 'edit:redo', label: 'Redo', shortcut: '⌘⇧Z', action: () => menuActions.edit.redo() },
      { type: 'separator' },
      { id: 'edit:cut', label: 'Cut', shortcut: '⌘X', action: () => menuActions.edit.cut() },
      { id: 'edit:copy', label: 'Copy', shortcut: '⌘C', action: () => menuActions.edit.copy() },
      { id: 'edit:paste', label: 'Paste', shortcut: '⌘V', action: () => menuActions.edit.paste() },
      { type: 'separator' },
      { id: 'edit:find', label: 'Find...', shortcut: '⌘F', action: () => menuActions.edit.find() },
      { id: 'edit:replace', label: 'Replace...', shortcut: '⌘H', action: () => menuActions.edit.replace() },
      { type: 'separator' },
      { id: 'edit:ai-assist', label: '💡 Ask AI Assistant...', shortcut: '⌘K', action: () => menuActions.edit.aiAssist(), prominent: true },
    ],
  },
  {
    label: 'Code',
    items: [
      { id: 'code:run-selection', label: 'Run Current Line/Selection', shortcut: '⌘↵', action: () => menuActions.code.runSelection(), description: 'Uses Editor execution with metadata' },
      { id: 'code:run-all', label: 'Run All', shortcut: '⌘⇧↵', action: () => menuActions.code.runAll(), description: 'Uses Editor execution with metadata' },
      { id: 'code:source-file', label: 'Source File', action: () => menuActions.code.sourceFile() },
      { type: 'separator' },
      {
        id: 'code:interrupt',
        label: 'Interrupt R',
        shortcut: 'Esc',
        action: () => menuActions.code.interrupt(),
        enabled: () => useStore.getState().execution?.isRunning ?? false,
      },
      { id: 'code:restart-session', label: 'Restart R Session', shortcut: '⌘⇧0', action: () => menuActions.code.restartSession() },
      { type: 'separator' },
      { id: 'code:comment', label: 'Comment/Uncomment Lines', shortcut: '⌘/', action: () => menuActions.code.comment() },
    ],
  },
  {
    label: 'Session',
    items: [
      { id: 'session:show-timeline', label: 'Show Timeline', shortcut: '⌘T', action: () => menuActions.session.showTimeline() },
      { id: 'session:export-reproducible', label: 'Export Reproducible Package', action: () => menuActions.session.exportReproducible() },
      { type: 'separator' },
      { id: 'session:new', label: 'New Session', shortcut: '⌘⇧N', action: () => menuActions.session.new() },
      { id: 'session:save', label: 'Save Session...', action: () => menuActions.session.save() },
      { id: 'session:load', label: 'Load Session...', action: () => menuActions.session.load() },
      { type: 'separator' },
      { id: 'session:info', label: 'Session Info', action: () => menuActions.session.info() },
      { id: 'session:settings', label: 'Settings...', shortcut: '⌘,', action: () => menuActions.session.settings() },
    ],
  },
  {
    label: 'View',
    items: [
      {
        id: 'view:toggle-editor',
        label: 'Show/Hide Editor',
        shortcut: '⌘1',
        action: () => menuActions.view.togglePane('editor'),
        checked: () => useStore.getState().view.panes.editor,
      },
      {
        id: 'view:toggle-console',
        label: 'Show/Hide Console',
        shortcut: '⌘2',
        action: () => menuActions.view.togglePane('console'),
        checked: () => useStore.getState().view.panes.console,
      },
      {
        id: 'view:toggle-plots',
        label: 'Show/Hide Plots',
        shortcut: '⌘3',
        action: () => menuActions.view.togglePane('plots'),
        checked: () => useStore.getState().view.panes.plots,
      },
      {
        id: 'view:toggle-timeline',
        label: 'Show/Hide Timeline',
        shortcut: '⌘4',
        action: () => menuActions.view.togglePane('timeline'),
        checked: () => useStore.getState().view.panes.timeline,
      },
      { type: 'separator' },
      { id: 'view:zoom-in', label: 'Zoom In', shortcut: '⌘+', action: () => menuActions.view.zoomIn() },
      { id: 'view:zoom-out', label: 'Zoom Out', shortcut: '⌘-', action: () => menuActions.view.zoomOut() },
      { id: 'view:zoom-reset', label: 'Reset Zoom', shortcut: '⌘0', action: () => menuActions.view.zoomReset() },
    ],
  },
  {
    label: 'Help',
    items: [
      { id: 'help:docs', label: 'Documentation', action: () => menuActions.help.docs() },
      { id: 'help:shortcuts', label: 'Keyboard Shortcuts', action: () => menuActions.help.shortcuts() },
      { type: 'separator' },
      { id: 'help:report-issue', label: 'Report Issue', action: () => menuActions.help.reportIssue() },
      { id: 'help:about', label: 'About Re-prod', action: () => menuActions.help.about() },
    ],
  },
];

export function MenuBar(): JSX.Element {
  const isConnected = useStore((state) => state.isConnected);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menubarRef.current?.contains(event.target as Node)) {
        setOpenSection(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSection(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenSection = (label: string) => {
    setOpenSection(label);
  };

  const handleCloseMenus = () => setOpenSection(null);

  const isAnyMenuOpen = useMemo(() => openSection !== null, [openSection]);

  return (
    <div className="menubar" ref={menubarRef}>
      <div className="menubar-left">
        <span className="menubar-brand">Re-prod</span>
        <div className="menubar-menu">
          {menuSections.map((section) => (
            <MenuSectionComponent
              key={section.label}
              section={section}
              isOpen={openSection === section.label}
              anyMenuOpen={isAnyMenuOpen}
              onOpenExplicit={handleOpenSection}
              onClose={handleCloseMenus}
            />
          ))}
        </div>
      </div>
      <div className="menubar-right">
        <ConnectionIndicator isConnected={isConnected} />
      </div>
    </div>
  );
}

// Individual menu section component
interface MenuSectionComponentProps {
  section: MenuSection;
  isOpen: boolean;
  anyMenuOpen: boolean;
  onOpenExplicit: (label: string) => void;
  onClose: () => void;
}

function MenuSectionComponent({
  section,
  isOpen,
  anyMenuOpen,
  onOpenExplicit,
  onClose,
}: MenuSectionComponentProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = (focusButton = false) => {
    onClose();
    if (focusButton) {
      requestAnimationFrame(() => buttonRef.current?.focus());
    }
  };

  const getFocusableItems = (): HTMLButtonElement[] => {
    if (!menuRef.current) return [];
    return Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])')
    );
  };

  const focusFirstItem = () => {
    const items = getFocusableItems();
    items[0]?.focus();
  };

  const focusLastItem = () => {
    const items = getFocusableItems();
    items[items.length - 1]?.focus();
  };

  const handleButtonClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isOpen) {
      closeMenu(true);
    } else {
      onOpenExplicit(section.label);
      requestAnimationFrame(focusFirstItem);
    }
  };

  const handleButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        onOpenExplicit(section.label);
        requestAnimationFrame(focusFirstItem);
      } else {
        focusFirstItem();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        onOpenExplicit(section.label);
        requestAnimationFrame(focusLastItem);
      } else {
        focusLastItem();
      }
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeMenu(true);
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = getFocusableItems();
    if (items.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      }
      return;
    }

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const nextIndex = (currentIndex - 1 + items.length) % items.length;
        items[nextIndex]?.focus();
        break;
      }
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu();
        break;
      default:
        break;
    }
  };

  const handleMouseEnter = () => {
    if (anyMenuOpen && !isOpen) {
      onOpenExplicit(section.label);
    }
  };

  return (
    <div className="menu-section" onMouseEnter={handleMouseEnter}>
      <button
        ref={buttonRef}
        type="button"
        className={`menu-item ${isOpen ? 'active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleButtonClick}
        onKeyDown={handleButtonKeyDown}
      >
        {section.label}
      </button>
      <div
        ref={menuRef}
        className={`menu-dropdown ${isOpen ? '' : 'hidden'}`}
        role="menu"
        aria-label={section.label}
        aria-hidden={!isOpen}
        onKeyDown={handleMenuKeyDown}
      >
        {section.items.map((item, index) => {
          if ('type' in item && item.type === 'separator') {
            return <div key={`sep-${index}`} className="menu-dropdown-separator" role="separator" />;
          }

          const menuItem = item as MenuItem;
          const isEnabled = menuItem.enabled ? menuItem.enabled() : true;
          const isChecked = menuItem.checked ? menuItem.checked() : false;

          return (
            <button
              key={menuItem.id}
              type="button"
              role="menuitem"
              className="menu-dropdown-item"
              data-id={menuItem.id}
              data-disabled={!isEnabled}
              data-checked={isChecked}
              disabled={!isEnabled}
              onClick={() => {
                menuItem.action();
                closeMenu();
              }}
            >
              <span className="menu-item-label">
                {menuItem.checked ? <span className="menu-item-check">{isChecked ? '✓' : ''}</span> : null}
                {menuItem.label}
              </span>
              {menuItem.shortcut && <span className="menu-item-shortcut">{menuItem.shortcut}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Connection indicator component
function ConnectionIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="connection-dot"></span>
      <span className="connection-text">{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
