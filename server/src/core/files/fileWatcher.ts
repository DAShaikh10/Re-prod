import chokidar, { FSWatcher } from 'chokidar';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '../../../../shared/src/types';

export class FileWatcher {
  private watchers: Map<string, FSWatcher> = new Map();
  private clientFiles: Map<string, Set<string>> = new Map();
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  watch(filepath: string, clientId: string): void {
    if (!existsSync(filepath)) {
      console.warn(`File does not exist: ${filepath}`);
      return;
    }

    // Track client watching this file
    if (!this.clientFiles.has(clientId)) {
      this.clientFiles.set(clientId, new Set());
    }
    this.clientFiles.get(clientId)!.add(filepath);

    // If already watching, don't create duplicate watcher
    if (this.watchers.has(filepath)) {
      return;
    }

    const watcher = chokidar.watch(filepath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    watcher.on('change', async () => {
      try {
        const content = await readFile(filepath, 'utf-8');

        // Emit to all connected clients
        this.io.emit('file-changed', {
          filepath,
          content,
          timestamp: Date.now()
        });

        console.log(`File changed: ${filepath}`);
      } catch (error) {
        console.error(`Error reading changed file ${filepath}:`, error);
      }
    });

    watcher.on('unlink', () => {
      console.log(`File deleted: ${filepath}`);
      this.unwatch(filepath, clientId);
    });

    watcher.on('error', (error) => {
      console.error(`Watcher error for ${filepath}:`, error);
    });

    this.watchers.set(filepath, watcher);
    console.log(`Started watching: ${filepath}`);
  }

  unwatch(filepath: string, clientId: string): void {
    const clientPaths = this.clientFiles.get(clientId);
    if (clientPaths) {
      clientPaths.delete(filepath);
    }

    // Check if any other clients are watching
    const stillWatched = Array.from(this.clientFiles.values())
      .some(paths => paths.has(filepath));

    if (!stillWatched) {
      const watcher = this.watchers.get(filepath);
      if (watcher) {
        watcher.close();
        this.watchers.delete(filepath);
        console.log(`Stopped watching: ${filepath}`);
      }
    }
  }

  cleanupClient(clientId: string): void {
    const clientPaths = this.clientFiles.get(clientId);
    if (clientPaths) {
      clientPaths.forEach(filepath => {
        this.unwatch(filepath, clientId);
      });
      this.clientFiles.delete(clientId);
    }
  }

  async saveFile(filepath: string, content: string): Promise<boolean> {
    try {
      await writeFile(filepath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error(`Failed to save file ${filepath}:`, error);
      return false;
    }
  }

  async loadFile(filepath: string): Promise<string | null> {
    try {
      if (!existsSync(filepath)) {
        return null;
      }
      return await readFile(filepath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load file ${filepath}:`, error);
      return null;
    }
  }

  async close(): Promise<void> {
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();
    this.clientFiles.clear();
  }
}
