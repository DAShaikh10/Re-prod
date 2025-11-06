import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, type StoreState } from '@/core';
import type { PanelTabItem } from '@/components/shared/PanelTabs';
import type { ConsoleTabId } from '@/types/panels';

interface UseConsolePanelStateResult {
  execution: StoreState['execution'];
  tabs: PanelTabItem<ConsoleTabId>[];
  activeTab: ConsoleTabId;
  setActiveTab: (tab: ConsoleTabId) => void;
  consoleEndRef: RefObject<HTMLDivElement>;
  clearExecutionResults: () => void;
}

/**
 * Encapsulates the stateful logic of the console panel so the component
 * focuses on presentation. Keeps tab options, auto-scroll behaviour, and
 * store wiring together.
 */
export function useConsolePanelState(): UseConsolePanelStateResult {
  const execution = useStore((state) => state.execution);
  const clearExecutionResults = useStore((state) => state.clearExecutionResults);
  const [activeTab, setActiveTab] = useState<ConsoleTabId>('console');
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const tabs = useMemo<PanelTabItem<ConsoleTabId>[]>(() => {
    return [
      { id: 'console', label: 'Console' },
      { id: 'history', label: 'History' },
    ];
  }, []);

  useEffect(() => {
    if (activeTab === 'console') {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [execution.results, activeTab]);

  return {
    execution,
    tabs,
    activeTab,
    setActiveTab,
    consoleEndRef,
    clearExecutionResults,
  };
}
