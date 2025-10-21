import Anthropic from '@anthropic-ai/sdk';
import type { AIRequest, AIResponse } from '../../../shared/src/types';

export class AIService {
  private client: Anthropic | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;

    if (this.apiKey) {
      this.client = new Anthropic({
        apiKey: this.apiKey
      });
      console.log('Claude API initialized');
    } else {
      console.warn('ANTHROPIC_API_KEY not found - AI features will be limited');
    }
  }

  async getCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      return {
        message: '⚠️ AI service is not configured. Please add ANTHROPIC_API_KEY to your environment.',
        timestamp: Date.now()
      };
    }

    try {
      const prompt = this.buildPrompt(request);

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const messageText = content.text;

      // Extract code blocks if present
      const codeBlockMatch = messageText.match(/```r?\n([\s\S]*?)\n```/);
      const suggestedCode = codeBlockMatch ? codeBlockMatch[1].trim() : undefined;

      // Remove code blocks from message for cleaner display
      const cleanMessage = messageText.replace(/```r?\n[\s\S]*?\n```/g, '').trim();

      return {
        message: cleanMessage,
        suggestedCode,
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Claude API error:', error);

      let errorMessage = '❌ Error communicating with AI';

      // Handle specific Anthropic API errors
      if (error?.status === 401) {
        errorMessage = '🔐 Authentication failed. Please check your ANTHROPIC_API_KEY.';
      } else if (error?.status === 429) {
        errorMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
      } else if (error?.error?.type === 'invalid_request_error') {
        // Credit balance error
        if (error.error.message?.includes('credit balance')) {
          errorMessage = '💳 API credit balance is too low. Please add credits to your Anthropic account.\n\nVisit: https://console.anthropic.com/settings/plans';
        } else {
          errorMessage = `⚠️ Invalid request: ${error.error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = `❌ ${error.message}`;
      }

      return {
        message: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    let prompt = 'You are an expert R programming assistant helping with data analysis and visualization.\n\n';

    if (request.code && request.code.trim().length > 0) {
      prompt += `Current R code:\n\`\`\`r\n${request.code}\n\`\`\`\n\n`;
    }

    if (request.context?.executionHistory && request.context.executionHistory.length > 0) {
      const lastExecution = request.context.executionHistory[request.context.executionHistory.length - 1];

      if (lastExecution.stdout) {
        prompt += `Last execution output:\n\`\`\`\n${lastExecution.stdout.slice(0, 500)}\n\`\`\`\n\n`;
      }

      if (lastExecution.stderr) {
        prompt += `Last execution errors/warnings:\n\`\`\`\n${lastExecution.stderr.slice(0, 500)}\n\`\`\`\n\n`;
      }
    }

    if (request.context?.cursorPosition) {
      prompt += `Cursor is at line ${request.context.cursorPosition.line}, column ${request.context.cursorPosition.column}.\n\n`;
    }

    prompt += `User question: ${request.prompt}\n\n`;

    prompt += 'Please provide a helpful, concise response. If you suggest code:\n';
    prompt += '1. Wrap R code in ```r code blocks\n';
    prompt += '2. Explain what the code does\n';
    prompt += '3. Include comments in the code for clarity\n';
    prompt += '4. Suggest best practices for R data analysis\n';

    return prompt;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
