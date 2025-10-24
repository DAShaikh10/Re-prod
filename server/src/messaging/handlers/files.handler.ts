import { FILE_EVENTS } from '../events';
import type { AppSocket } from '../types';
import { loadFileSchema, saveFileSchema, unwatchFileSchema, watchFileSchema } from '../../schemas/files.schema';
import type { FileWatcher } from '../../services/fileWatcher';

export class FilesHandler {
  constructor(private readonly fileWatcher: FileWatcher) {}

  register(socket: AppSocket): void {
    socket.on(FILE_EVENTS.WATCH, (filepath) => {
      const validation = watchFileSchema.safeParse({ filepath });
      if (!validation.success) {
        return;
      }

      this.fileWatcher.watch(validation.data.filepath, socket.id);
    });

    socket.on(FILE_EVENTS.UNWATCH, (filepath) => {
      const validation = unwatchFileSchema.safeParse({ filepath });
      if (!validation.success) {
        return;
      }

      this.fileWatcher.unwatch(validation.data.filepath, socket.id);
    });

    socket.on(FILE_EVENTS.SAVE, async (data, callback) => {
      const validation = saveFileSchema.safeParse(data);
      if (!validation.success) {
        callback(false);
        return;
      }

      const success = await this.fileWatcher.saveFile(validation.data.filepath, validation.data.content);
      callback(success);
    });

    socket.on(FILE_EVENTS.LOAD, async (data, callback) => {
      const validation = loadFileSchema.safeParse(data);
      if (!validation.success) {
        callback(null);
        return;
      }

      const content = await this.fileWatcher.loadFile(validation.data.filepath);

      if (content !== null) {
        callback({
          filepath: validation.data.filepath,
          content,
          timestamp: Date.now()
        });
      } else {
        callback(null);
      }
    });
  }
}
