import { FILE_EVENTS } from '../events';
import type { AppSocket } from '../types';
import { loadFileSchema, saveFileSchema, unwatchFileSchema, watchFileSchema } from '../../schemas/files.schema';
import type { FileWatcher } from '../../core/files/fileWatcher';
import type { ClientToServerEvents, FileChangeData } from '../../../../shared/src/types';

type WatchArgs = Parameters<ClientToServerEvents['watch-file']>;
type UnwatchArgs = Parameters<ClientToServerEvents['unwatch-file']>;
type SaveArgs = Parameters<ClientToServerEvents['save-file']>;
type LoadArgs = Parameters<ClientToServerEvents['load-file']>;

export class FilesHandler {
  constructor(private readonly fileWatcher: FileWatcher) {}

  register(socket: AppSocket): void {
    socket.on(FILE_EVENTS.WATCH, (filepath: WatchArgs[0]) => {
      const validation = watchFileSchema.safeParse({ filepath });
      if (!validation.success) {
        return;
      }

      this.fileWatcher.watch(validation.data.filepath, socket.id);
    });

    socket.on(FILE_EVENTS.UNWATCH, (filepath: UnwatchArgs[0]) => {
      const validation = unwatchFileSchema.safeParse({ filepath });
      if (!validation.success) {
        return;
      }

      this.fileWatcher.unwatch(validation.data.filepath, socket.id);
    });

    socket.on(FILE_EVENTS.SAVE, async (data: SaveArgs[0], callback: SaveArgs[1]) => {
      const validation = saveFileSchema.safeParse(data);
      if (!validation.success) {
        callback(false);
        return;
      }

      const success = await this.fileWatcher.saveFile(validation.data.filepath, validation.data.content);
      callback(success);
    });

    socket.on(FILE_EVENTS.LOAD, async (data: LoadArgs[0], callback: LoadArgs[1]) => {
      const validation = loadFileSchema.safeParse(data);
      if (!validation.success) {
        callback(null);
        return;
      }

      const content = await this.fileWatcher.loadFile(validation.data.filepath);

      if (content !== null) {
        const result: FileChangeData = {
          filepath: validation.data.filepath,
          content,
          timestamp: Date.now()
        };
        callback(result);
      } else {
        callback(null);
      }
    });
  }
}
