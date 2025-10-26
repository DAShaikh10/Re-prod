import type { Request, Response } from 'express';
import { Router } from 'express';
import { AppConfig } from '@server/config/settings';
import type { AIService } from '@server/core/ai/aiService';

export function createHealthRouter(aiService: AIService): Router {
  const router = Router();
  const config = AppConfig.getInstance();

  router.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      aiConfigured: aiService.isConfigured(),
      provider: aiService.getProviderInfo().provider,
      environment: config.nodeEnv
    });
  });

  return router;
}
