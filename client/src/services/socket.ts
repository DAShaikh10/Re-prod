import type { ExecutionRequestPayload, ExecutionResultPayload } from '../../../shared/src/types';

type WSRequest =
  | { type: 'execute'; request: ExecutionRequestPayload }
  | { type: 'ai_message'; messages: Array<{ role: string; content: string }> };

export type WSResponse =
  | { type: 'execution_result'; result: ExecutionResultPayload }
  | { type: 'ai_response'; response: string }
  | { type: 'error'; message: string };

type MessageHandler = (response: WSResponse) => void;

class SocketService {
  private ws: WebSocket | null = null;
  // Event handlers keyed by response.type (e.g., 'ai_response').
  private messageHandlers: Map<string, MessageHandler> = new Map();
  // One-shot handlers for request/response style calls. FIFO dispatch.
  private oneShotHandlers: MessageHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string = '';

  connect(url: string = 'ws://localhost:3001/ws'): void {
    // Prevent duplicate connections
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    this.url = url;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const response: WSResponse = JSON.parse(event.data);
        // Deliver to one-shot handler if queued
        const next = this.oneShotHandlers.shift();
        if (next) next(response);
        // Deliver to type-specific handler
        const specific = this.messageHandlers.get((response as any).type);
        if (specific) specific(response);
        // Wildcard handler (optional)
        const anyHandler = this.messageHandlers.get('*');
        if (anyHandler) anyHandler(response);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      // Auto-reconnect after 2 seconds
      this.reconnectTimer = setTimeout(() => {
        this.connect(this.url);
      }, 2000);
    };
  }

  send(request: WSRequest, handler?: MessageHandler): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    if (handler) this.oneShotHandlers.push(handler);

    this.ws.send(JSON.stringify(request));
  }

  on(event: string, handler: MessageHandler): void {
    this.messageHandlers.set(event, handler);
  }

  off(event: string): void {
    this.messageHandlers.delete(event);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnecting');
      }
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.oneShotHandlers = [];
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const socketService = new SocketService();
