export const EXECUTION_EVENTS = {
  EXECUTE: 'execute'
} as const;

export type ExecutionEvent = typeof EXECUTION_EVENTS[keyof typeof EXECUTION_EVENTS];
