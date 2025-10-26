import type { AppSocket } from '../types';
import type { FileWatcher } from '@server/core/files/fileWatcher';

export class ConnectionHandler {
  constructor(private readonly fileWatcher: FileWatcher) {}

  register(socket: AppSocket): void {
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      this.fileWatcher.cleanupClient(socket.id);
    });
  }
}
