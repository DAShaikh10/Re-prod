import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RExecutor } from './services/rExecutor';
import { FileWatcher } from './services/fileWatcher';
import { AIService } from './services/aiService';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ExecutionResult,
  ExecutionError
} from '../../shared/src/types';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize services
const rExecutor = new RExecutor();
const fileWatcher = new FileWatcher(io);
const aiService = new AIService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    aiConfigured: aiService.isConfigured()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Execute R code
  socket.on('execute', async (code: string, callback) => {
    try {
      const result = await rExecutor.execute(code);
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

  // Watch file
  socket.on('watch-file', (filepath: string) => {
    fileWatcher.watch(filepath, socket.id);
  });

  // Unwatch file
  socket.on('unwatch-file', (filepath: string) => {
    fileWatcher.unwatch(filepath, socket.id);
  });

  // AI request
  socket.on('ai-request', async (request, callback) => {
    try {
      const response = await aiService.getCompletion(request);
      callback(response);
    } catch (error) {
      callback({
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
    }
  });

  // Save file
  socket.on('save-file', async (data, callback) => {
    const success = await fileWatcher.saveFile(data.filepath, data.content);
    callback(success);

    if (success) {
      io.emit('status-update', {
        type: 'info',
        message: `File saved: ${data.filepath}`,
        timestamp: Date.now()
      });
    }
  });

  // Load file
  socket.on('load-file', async (filepath: string, callback) => {
    const content = await fileWatcher.loadFile(filepath);

    if (content !== null) {
      callback({
        filepath,
        content,
        timestamp: Date.now()
      });
    } else {
      callback(null);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    fileWatcher.cleanupClient(socket.id);
  });
});

// Cleanup old temp files periodically
setInterval(() => {
  rExecutor.cleanup();
}, 3600000); // Every hour

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Re-prod server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🤖 AI service: ${aiService.isConfigured() ? 'Configured' : 'Not configured'}`);
  console.log(`📊 R path: ${process.env.R_PATH || 'Rscript'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await fileWatcher.close();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
