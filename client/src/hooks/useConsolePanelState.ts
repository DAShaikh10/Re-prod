import { type RefObject, useEffect, useRef } from 'react';
import { useStore, type StoreState } from '@/core';

interface UseConsolePanelStateResult {
  execution: StoreState['execution'];
  consoleEndRef: RefObject<HTMLDivElement>;
  clearExecutionResults: () => void;
}

export function useConsolePanelState(): UseConsolePanelStateResult {
  const execution = useStore((state) => state.execution);
  const clearExecutionResults = useStore((state) => state.clearExecutionResults);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [execution.results]);

  return {
    execution,
    consoleEndRef,
    clearExecutionResults,
  };
}
