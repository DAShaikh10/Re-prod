/**
 * MenuBar Component
 *
 * Main menu bar with 6 sections: File, Edit, Code, Session, View, Help
 * Uses Headless UI for accessible dropdown menus
 */

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useStore } from '@/core/state/store';
import { menuActions } from '@/services/menuActions';
import { type MenuSection, type MenuItem } from '@/types/menu';
import { useMonacoEditor } from '@/hooks/useMonacoEditor';

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
      { id: 'edit:undo', label: 'Undo', shortcut: '⌘Z', action: (ed) => menuActions.edit.undo(ed) },
      { id: 'edit:redo', label: 'Redo', shortcut: '⌘⇧Z', action: (ed) => menuActions.edit.redo(ed) },
      { type: 'separator' },
      { id: 'edit:cut', label: 'Cut', shortcut: '⌘X', action: (ed) => menuActions.edit.cut(ed) },
      { id: 'edit:copy', label: 'Copy', shortcut: '⌘C', action: (ed) => menuActions.edit.copy(ed) },
      { id: 'edit:paste', label: 'Paste', shortcut: '⌘V', action: (ed) => menuActions.edit.paste(ed) },
      { type: 'separator' },
      { id: 'edit:find', label: 'Find...', shortcut: '⌘F', action: (ed) => menuActions.edit.find(ed) },
      { id: 'edit:replace', label: 'Replace...', shortcut: '⌘H', action: (ed) => menuActions.edit.replace(ed) },
      { type: 'separator' },
      { id: 'edit:ai-assist', label: '💡 Ask AI Assistant...', shortcut: '⌘K', action: () => menuActions.edit.aiAssist(), prominent: true },
    ],
  },
  {
    label: 'Code',
    items: [
      { id: 'code:run-selection', label: 'Run Current Line/Selection', shortcut: '⌘↵', action: (ed) => menuActions.code.runSelection(ed) },
      { id: 'code:run-all', label: 'Run All', shortcut: '⌘⇧↵', action: (ed) => menuActions.code.runAll(ed) },
      { id: 'code:source-file', label: 'Source File', shortcut: '⌘⇧S', action: (ed) => menuActions.code.sourceFile(ed) },
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
      { id: 'code:comment', label: 'Comment/Uncomment Lines', shortcut: '⌘/', action: (ed) => menuActions.code.comment(ed) },
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
      },
      {
        id: 'view:toggle-console',
        label: 'Show/Hide Console',
        shortcut: '⌘2',
        action: () => menuActions.view.togglePane('console'),
      },
      {
        id: 'view:toggle-plots',
        label: 'Show/Hide Plots',
        shortcut: '⌘3',
        action: () => menuActions.view.togglePane('plots'),
      },
      {
        id: 'view:toggle-timeline',
        label: 'Show/Hide Timeline',
        shortcut: '⌘4',
        action: () => menuActions.view.togglePane('timeline'),
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
  const editor = useMonacoEditor();

  return (
    <div className="menubar">
      <div className="menubar-left">
        <span className="menubar-brand">Re-prod</span>
        <div className="menubar-menu">
          {menuSections.map((section) => (
            <MenuSectionComponent key={section.label} section={section} editor={editor} />
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
function MenuSectionComponent({ section, editor }: { section: MenuSection; editor: any }) {
  return (
    <div className="menu-section">
      <Menu>
        {({ open }: { open: boolean }) => (
          <>
            <Menu.Button className={`menu-item ${open ? 'active' : ''}`}>{section.label}</Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="menu-dropdown">
              {section.items.map((item, index) => {
                if ('type' in item && item.type === 'separator') {
                  return <div key={`sep-${index}`} className="menu-dropdown-separator" />;
                }

                const menuItem = item as MenuItem;
                const isEnabled = menuItem.enabled ? menuItem.enabled() : true;
                const isChecked = menuItem.checked ? menuItem.checked() : false;

                return (
                  <Menu.Item key={menuItem.id} disabled={!isEnabled}>
                    {() => (
                      <button
                        className="menu-dropdown-item"
                        data-id={menuItem.id}
                        data-disabled={!isEnabled}
                        data-checked={isChecked}
                        onClick={() => menuItem.action(editor)}
                      >
                        <span className="menu-item-label">
                          {menuItem.checked && <span className="menu-item-check">{isChecked ? '✓' : ''}</span>}
                          {menuItem.label}
                        </span>
                        {menuItem.shortcut && <span className="menu-item-shortcut">{menuItem.shortcut}</span>}
                      </button>
                    )}
                  </Menu.Item>
                );
              })}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
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
