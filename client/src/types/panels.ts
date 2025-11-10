/**
 * Cross-component UI panel types.
 *
 * These types intentionally live outside React components so that hooks,
 * services, and tests can share a consistent vocabulary when dealing with
 * panel interactions.
 */

/** Tabs rendered in the Console panel */
export type ConsoleTabId = 'console' | 'history';

/** Tabs rendered in the unified right pane */
export type UnifiedRightPaneTab = 'plots' | 'timeline' | 'help';

/** Payload sent when other components want to focus a plot */
export interface PlotFocusEventDetail {
  plotIndex: number;
}

/** State snapshot for navigating generated plots */
export interface PlotNavigationState {
  activeTab: UnifiedRightPaneTab;
  selectedPlotIndex: number;
  totalPlots: number;
}

/** Strongly typed custom event fired from the console */
export type PlotFocusCustomEvent = CustomEvent<PlotFocusEventDetail>;
