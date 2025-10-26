import type { AIRequest, AIResponse } from '@shared/types';

export interface AIProvider {
  getCompletion(request: AIRequest): Promise<AIResponse>;
  isConfigured(): boolean;
  getName(): string;
}
