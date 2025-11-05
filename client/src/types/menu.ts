/**
 * Menu System Type Definitions
 *
 * Simple type system for Re-prod's menu structure.
 * No complex abstractions - just plain TypeScript interfaces.
 */

/**
 * Individual menu item that triggers an action
 */
export interface MenuItem {
  /** Unique identifier (e.g., "file:save") */
  id: string;

  /** Display label */
  label: string;

  /** Keyboard shortcut (e.g., "⌘S") */
  shortcut?: string;

  /** Action to execute when item is clicked */
  action: () => void;

  /** Function to check if item should be enabled */
  enabled?: () => boolean;

  /** Function to check if item should show checkmark (for toggles) */
  checked?: () => boolean;

  /** Tooltip description */
  description?: string;

  /** Visual prominence (for AI Assistant item) */
  prominent?: boolean;
}

/**
 * Menu separator (horizontal line)
 */
export interface MenuSeparator {
  type: 'separator';
}

/**
 * Union type for menu items and separators
 */
export type MenuItemOrSeparator = MenuItem | MenuSeparator;

/**
 * Menu section (File, Edit, Code, etc.)
 */
export interface MenuSection {
  /** Section label */
  label: string;

  /** Items in this section */
  items: MenuItemOrSeparator[];
}
