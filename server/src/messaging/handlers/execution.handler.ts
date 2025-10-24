import { EXECUTION_EVENTS } from '../events';
import type { AppSocket } from '../types';
import { executionRequestSchema } from '../../schemas/execution.schema';
import type { RExecutor } from '@server/core/execution/rExecutor';
import type { ExecutionError, ClientToServerEvents } from '@shared/types';

type ExecuteArgs = Parameters<ClientToServerEvents['execute']>;

export class ExecutionHandler {
  constructor(private readonly rExecutor: RExecutor) {}

  register(socket: AppSocket): void {
    socket.on(EXECUTION_EVENTS.EXECUTE, async (code: ExecuteArgs[0], callback: ExecuteArgs[1]) => {
      const validation = executionRequestSchema.safeParse({ code });

      if (!validation.success) {
        const errorResult: ExecutionError = {
          message: 'Invalid execution payload',
          type: 'system',
          timestamp: Date.now(),
          success: false
        };
        callback(errorResult);
        return;
      }

      try {
        const result = await this.rExecutor.execute(validation.data.code);
        callback(result);
      } catch (error) {
        const errorResult: ExecutionError = {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'system',
          timestamp: Date.now(),
          success: false
        };
        callback(errorResult);
      }
    });
  }
}
