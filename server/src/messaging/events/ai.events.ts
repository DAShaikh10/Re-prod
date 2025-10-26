export const AI_EVENTS = {
  REQUEST: 'ai-request'
} as const;

export type AIEvent = typeof AI_EVENTS[keyof typeof AI_EVENTS];
