import { AI_EVENTS } from '../events';
import type { AppSocket } from '../types';
import { aiRequestSchema } from '../../schemas/ai.schema';
import type { AIService } from '../../core/ai/aiService';
import type { ClientToServerEvents } from '../../../../shared/src/types';

type AIArgs = Parameters<ClientToServerEvents['ai-request']>;

export class AIHandler {
  constructor(private readonly aiService: AIService) {}

  register(socket: AppSocket): void {
    socket.on(AI_EVENTS.REQUEST, async (request: AIArgs[0], callback: AIArgs[1]) => {
      const validation = aiRequestSchema.safeParse(request);

      if (!validation.success) {
        callback({
          message: 'Invalid AI request payload',
          timestamp: Date.now()
        });
        return;
      }

      try {
        const response = await this.aiService.getCompletion(validation.data);
        callback(response);
      } catch (error) {
        callback({
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now()
        });
      }
    });
  }
}
