import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { loadEnv, resetEnvCache } from '../config/env';

const originalEnv = { ...process.env };

describe('AppConfig environment validation', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    resetEnvCache();
  });

  it('applies default values when env vars are missing', () => {
    process.env = {} as NodeJS.ProcessEnv;
    resetEnvCache();

    const env = loadEnv();

    expect(env.PORT).toBe(4000);
    expect(env.CLIENT_URL).toBe('http://localhost:5173');
    expect(env.AI_PROVIDER).toBe('openai');
    expect(env.R_PATH).toBe('Rscript');
  });

  it('parses custom values correctly', () => {
    process.env = {
      PORT: '5555',
      CLIENT_URL: 'https://example.com',
      AI_PROVIDER: 'anthropic',
      OPENAI_MODEL: 'gpt-4.1-mini',
      R_PATH: '/opt/r/Rscript',
      TEMP_DIR: './tmp'
    } as NodeJS.ProcessEnv;
    resetEnvCache();

    const env = loadEnv();

    expect(env.PORT).toBe(5555);
    expect(env.CLIENT_URL).toBe('https://example.com');
    expect(env.AI_PROVIDER).toBe('anthropic');
    expect(env.OPENAI_MODEL).toBe('gpt-4.1-mini');
    expect(env.R_PATH).toBe('/opt/r/Rscript');
    expect(env.TEMP_DIR).toBe('./tmp');
  });

  it('throws when env values are invalid', () => {
    process.env = { PORT: 'not-a-number' } as NodeJS.ProcessEnv;
    resetEnvCache();

    expect(() => loadEnv()).toThrowError('Invalid environment configuration');
  });
});

afterAll(() => {
  process.env = { ...originalEnv };
  resetEnvCache();
});

