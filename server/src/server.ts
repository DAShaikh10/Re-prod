import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { requestLogger } from './api/middleware/logger';
import { errorHandler } from './api/middleware/errorHandler';
import { createHealthRouter } from './api/routes/health';
import { RExecutor } from './core/execution/rExecutor';
import { FileWatcher } from './core/files/fileWatcher';
import { AIService } from './core/ai/aiService';
import { AppConfig } from './config/settings';
import { registerSocketHandlers } from './messaging/socket';
import type {
  ServerToClientEvents,
  ClientToServerEvents
} from '@shared/types';

const app = express();
const httpServer = createServer(app);
const config = AppConfig.getInstance();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = config.port;

// Middleware
app.use(requestLogger);
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
app.use(express.json());

// Initialize services
const rExecutor = new RExecutor();
const fileWatcher = new FileWatcher(io);
const aiService = new AIService();

// API routes
app.use('/health', createHealthRouter(aiService));

registerSocketHandlers(io, {
  rExecutor,
  fileWatcher,
  aiService
});

// Cleanup old temp files periodically
setInterval(() => {
  rExecutor.cleanup();
}, 3600000); // Every hour

app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Re-prod server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🤖 AI service: ${aiService.isConfigured() ? 'Configured' : 'Not configured'}`);
  console.log(`📊 R path: ${config.rPath}`);
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
