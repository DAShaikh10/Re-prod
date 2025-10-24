export class Logger {
  debug(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[debug]', ...args);
    }
  }

  info(...args: unknown[]): void {
    console.info('[info]', ...args);
  }

  warn(...args: unknown[]): void {
    console.warn('[warn]', ...args);
  }

  error(...args: unknown[]): void {
    console.error('[error]', ...args);
  }
}

export const logger = new Logger();
