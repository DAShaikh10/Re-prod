export const FILE_EVENTS = {
  WATCH: 'watch-file',
  UNWATCH: 'unwatch-file',
  SAVE: 'save-file',
  LOAD: 'load-file'
} as const;

export type FileEvent = typeof FILE_EVENTS[keyof typeof FILE_EVENTS];
