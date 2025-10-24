import type { AIRequest, AIResponse } from '@shared/types';
import { AppConfig } from '../../config/settings';
import { AnthropicProvider, OpenAIProvider, AIProvider } from './providers';

export class AIService {
  private provider: AIProvider;

  constructor() {
    const config = AppConfig.getInstance();

    if (config.aiProvider === 'anthropic') {
      this.provider = new AnthropicProvider();
    } else {
      this.provider = new OpenAIProvider();
    }
  }

  async getCompletion(request: AIRequest): Promise<AIResponse> {
    if (this.provider.isConfigured()) {
      return this.provider.getCompletion(request);
    }

    const missingKey = this.provider.getName() === 'OpenAI' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';

    return {
      message: `⚠️ AI service is not configured. Please add ${missingKey} to your environment.`,
      timestamp: Date.now()
    };
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  getProviderInfo(): { provider: string } {
    return { provider: this.provider.getName() };
  }
}
