import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, type StoreState } from '@/core';
import type { PanelTabItem } from '@/components/shared';
import type {
  UnifiedRightPaneTab,
  PlotNavigationState,
  PlotFocusCustomEvent,
} from '@/types/panels';
import type { ExecutionLogPlot } from '@shared/types';

interface UseUnifiedRightPaneStateResult {
  panes: StoreState['view']['panes'];
  tabs: PanelTabItem<UnifiedRightPaneTab>[];
  activeTab: UnifiedRightPaneTab;
  setActiveTab: (tab: UnifiedRightPaneTab) => void;
  navigation: PlotNavigationState;
  allPlots: ExecutionLogPlot[];
  currentPlot: ExecutionLogPlot | null;
  selectPreviousPlot: () => void;
  selectNextPlot: () => void;
}

/**
 * Encapsulates the data plumbing and interaction logic for the unified right
 * pane. Consumers receive a list of tabs, navigation helpers for plots, and
 * derived UI state without re-implementing the event subscriptions.
 */
export function useUnifiedRightPaneState(): UseUnifiedRightPaneStateResult {
  const execution = useStore((state) => state.execution);
  const panes = useStore((state) => state.view.panes);

  const [activeTab, setActiveTab] = useState<UnifiedRightPaneTab>('plots');
  const [selectedPlotIndex, setSelectedPlotIndex] = useState(0);
  const previousPlotCount = useRef(0);

  const allPlots = useMemo<ExecutionLogPlot[]>(
    () => execution.results.flatMap((result) => result.plots),
    [execution.results]
  );

  const plotsVisible = panes.plots;
  const timelineVisible = panes.timeline;
  const currentPlot = allPlots[selectedPlotIndex] ?? null;

  const tabs = useMemo<PanelTabItem<UnifiedRightPaneTab>[]>(() => {
    const list: PanelTabItem<UnifiedRightPaneTab>[] = [];
    if (plotsVisible) {
      list.push({ id: 'plots', label: 'Plots' });
    }
    if (timelineVisible) {
      list.push({ id: 'timeline', label: 'Timeline' });
    }
    list.push({ id: 'help', label: 'Help' });
    return list;
  }, [plotsVisible, timelineVisible]);

  useEffect(() => {
    const handleFocusPlot = (event: Event) => {
      if (!plotsVisible) {
        return;
      }

      const detail = (event as PlotFocusCustomEvent).detail;
      if (typeof detail?.plotIndex !== 'number') {
        return;
      }

      setActiveTab('plots');
      setSelectedPlotIndex(Math.max(0, Math.min(detail.plotIndex, allPlots.length - 1)));
    };

    window.addEventListener('focusPlot', handleFocusPlot);
    return () => {
      window.removeEventListener('focusPlot', handleFocusPlot);
    };
  }, [plotsVisible, allPlots.length]);

  useEffect(() => {
    const previousCount = previousPlotCount.current;
    if (plotsVisible && allPlots.length > previousCount) {
      setActiveTab('plots');
      setSelectedPlotIndex(allPlots.length - 1);
    }
    previousPlotCount.current = allPlots.length;
  }, [allPlots.length, plotsVisible]);

  useEffect(() => {
    if (selectedPlotIndex >= allPlots.length && allPlots.length > 0) {
      setSelectedPlotIndex(allPlots.length - 1);
    }
  }, [allPlots.length, selectedPlotIndex]);

  useEffect(() => {
    if (activeTab === 'plots' && !plotsVisible) {
      setActiveTab(timelineVisible ? 'timeline' : 'help');
    } else if (activeTab === 'timeline' && !timelineVisible) {
      setActiveTab(plotsVisible ? 'plots' : 'help');
    }
  }, [activeTab, plotsVisible, timelineVisible]);

  const selectPreviousPlot = useCallback(() => {
    setSelectedPlotIndex((current) => Math.max(0, current - 1));
  }, []);

  const selectNextPlot = useCallback(() => {
    setSelectedPlotIndex((current) => Math.min(allPlots.length - 1, current + 1));
  }, [allPlots.length]);

  const navigation: PlotNavigationState = {
    activeTab,
    selectedPlotIndex,
    totalPlots: allPlots.length,
  };

  return {
    panes,
    tabs,
    activeTab,
    setActiveTab,
    navigation,
    allPlots,
    currentPlot,
    selectPreviousPlot,
    selectNextPlot,
  };
}
