import OpenAI from 'openai';
import type { AIRequest, AIResponse, CodeBlock } from '../../../../../shared/src/types';
import { AppConfig } from '../../../config/settings';
import { AIProvider } from './base';

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor() {
    const config = AppConfig.getInstance();
    this.model = config.openaiModel;

    const apiKey = config.openaiApiKey;
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: config.openaiBaseUrl
        })
      : null;
  }

  getName(): string {
    return 'OpenAI';
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async getCompletion(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      return {
        message: 'OPENAI_API_KEY not configured.',
        timestamp: Date.now()
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      });

      const messageText = response.choices[0]?.message?.content || '';
      const codeBlocks = this.parseCodeBlocks(messageText);
      const cleanMessage = messageText
        .replace(/<!--\s*(REPLACE_ALL|REPLACE_LINES:\d+-\d+)\s*-->\s*```r?\s*\n[\s\S]*?```/g, '')
        .trim();
      const codeBlockMatch = messageText.match(/```r?\n([\s\S]*?)\n```/);
      const suggestedCode = codeBlockMatch && codeBlocks.length === 0 ? codeBlockMatch[1].trim() : undefined;

      return {
        message: cleanMessage,
        suggestedCode,
        codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
        timestamp: Date.now()
      };
    } catch (error) {
      return this.formatError(error);
    }
  }

  private buildPrompt(request: AIRequest): string {
    let prompt = 'You are an expert R programming assistant helping with data analysis and visualization.\n\n';

    if (request.code && request.code.trim().length > 0) {
      prompt += `Current R code in editor:\n\`\`\`r\n${request.code}\n\`\`\`\n\n`;
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

    if (request.context?.lastError) {
      prompt += `Last error:\n\`\`\`\n${request.context.lastError}\n\`\`\`\n\n`;
    }

    if (request.context?.selectedText) {
      prompt += `User selected code:\n\`\`\`r\n${request.context.selectedText}\n\`\`\`\n\n`;
    }

    if (request.context?.cursorPosition) {
      prompt += `Cursor is at line ${request.context.cursorPosition.line}, column ${request.context.cursorPosition.column}.\n\n`;
    }

    prompt += `User question: ${request.prompt}\n\n`;
    prompt += 'When suggesting code changes, format them using the following rules:\n';
    prompt += '- Wrap replacement code in R fenced code blocks.\n';
    prompt += '- Precede each block with <!-- REPLACE_ALL --> or <!-- REPLACE_LINES:start-end --> when applicable.\n';
    prompt += '- Prefer concise, step-by-step instructions.\n';

    return prompt;
  }

  private parseCodeBlocks(message: string): CodeBlock[] {
    const blockRegex = /<!--\s*(REPLACE_ALL|REPLACE_LINES:(\d+)-(\d+))\s*-->\s*```r?\n([\s\S]*?)\n```/g;
    const blocks: CodeBlock[] = [];
    let match: RegExpExecArray | null;
    let index = 0;

    while ((match = blockRegex.exec(message)) !== null) {
      const marker = match[1];
      const start = match[2] ? parseInt(match[2], 10) : undefined;
      const end = match[3] ? parseInt(match[3], 10) : undefined;
      const code = match[4].trim();

      blocks.push({
        id: `${marker}-${index++}`,
        code,
        language: 'r',
        action: marker === 'REPLACE_ALL' ? 'replace-all' : 'replace-lines',
        targetLines: marker === 'REPLACE_ALL' || !start || !end ? undefined : { start, end }
      });
    }

    return blocks;
  }

  private formatError(error: unknown): AIResponse {
    const providerName = this.getName();
    let message = `❌ Error communicating with ${providerName}`;
    const err = error as { status?: number; code?: string; message?: string; error?: { message?: string; type?: string } } | undefined;

    if (err?.status === 401 || err?.code === 'invalid_api_key') {
      message = `🔐 Authentication failed. Please check your ${providerName === 'OpenAI' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'}.`;
    } else if (err?.status === 429) {
      message = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
    } else if (err?.error?.type === 'invalid_request_error' || err?.code === 'insufficient_quota') {
      const detail = err?.error?.message || err?.message;
      if (detail?.includes('credit balance') || detail?.includes('quota')) {
        message = `💳 ${providerName} API credit balance is too low. Please add credits to your account.\n\nVisit: ${providerName === 'OpenAI' ? 'https://platform.openai.com/account/billing' : 'https://console.anthropic.com/settings/plans'}`;
      } else if (detail) {
        message = `⚠️ Invalid request: ${detail}`;
      }
    } else if (error instanceof Error) {
      message = `❌ ${error.message}`;
    }

    return {
      message,
      timestamp: Date.now()
    };
  }
}
