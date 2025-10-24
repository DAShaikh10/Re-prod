import type { AppServer } from './types';
import { ExecutionHandler, AIHandler, FilesHandler, ConnectionHandler } from './handlers';
import type { RExecutor } from '../services/rExecutor';
import type { FileWatcher } from '../services/fileWatcher';
import type { AIService } from '../services/aiService';

export interface MessagingDependencies {
  rExecutor: RExecutor;
  fileWatcher: FileWatcher;
  aiService: AIService;
}

export function registerSocketHandlers(io: AppServer, deps: MessagingDependencies): void {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    new ExecutionHandler(deps.rExecutor).register(socket);
    new AIHandler(deps.aiService).register(socket);
    new FilesHandler(deps.fileWatcher).register(socket);
    new ConnectionHandler(deps.fileWatcher).register(socket);
  });
}
