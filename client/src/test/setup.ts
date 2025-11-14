import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { socketService } from '@/services/socket';

// Extend Vitest matchers with jest-dom matchers
expect.extend(matchers);

// Disable auto reconnect during tests to avoid background timers and sockets.
socketService.disableAutoReconnect();

// Cleanup after each test case
afterEach(() => {
  cleanup();
  socketService.disconnect();
});
