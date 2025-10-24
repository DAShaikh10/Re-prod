import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AIService } from '@server/core/ai/aiService';
import { resetEnvCache } from '../config/env';

const originalEnv = { ...process.env };

describe('AIService', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    resetEnvCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetEnvCache();
  });

  it('returns not configured message when API keys are missing', async () => {
    const service = new AIService();
    const response = await service.getCompletion({ prompt: 'test', code: '' });
    expect(response.message).toContain('not configured');
  });

  it('reports configuration status', () => {
    const service = new AIService();
    expect(service.isConfigured()).toBe(false);
  });
});
