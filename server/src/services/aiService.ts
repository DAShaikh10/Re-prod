import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { AIRequest, AIResponse, CodeBlock } from '../../../shared/src/types';

type AIProvider = 'anthropic' | 'openai';

export class AIService {
  private provider: AIProvider;
  private anthropicClient: Anthropic | null = null;
  private openaiClient: OpenAI | null = null;
  private openaiModel: string;

  constructor() {
    // Determine which provider to use (default: openai)
    this.provider = (process.env.AI_PROVIDER as AIProvider) || 'openai';
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';

    if (this.provider === 'anthropic') {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
        console.log('Claude API initialized');
      } else {
        console.warn('ANTHROPIC_API_KEY not found');
      }
    } else if (this.provider === 'openai') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        this.openaiClient = new OpenAI({
          apiKey: openaiKey,
          baseURL: process.env.OPENAI_BASE_URL || undefined
        });
        console.log(`OpenAI API initialized (${this.openaiModel})`);
      } else {
        console.warn('OPENAI_API_KEY not found');
      }
    }
  }

  async getCompletion(request: AIRequest): Promise<AIResponse> {
    if (this.provider === 'openai' && this.openaiClient) {
      return this.getOpenAICompletion(request);
    } else if (this.provider === 'anthropic' && this.anthropicClient) {
      return this.getClaudeCompletion(request);
    } else {
      return {
        message: `⚠️ AI service is not configured. Please add ${this.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} to your environment.`,
        timestamp: Date.now()
      };
    }
  }

  private async getOpenAICompletion(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);

      const response = await this.openaiClient!.chat.completions.create({
        model: this.openaiModel,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2048
      });

      const messageText = response.choices[0]?.message?.content || '';

      // Parse code blocks with special markers
      const codeBlocks = this.parseCodeBlocks(messageText);

      // Remove marked code blocks from message for cleaner display
      const cleanMessage = messageText
        .replace(/<!--\s*(REPLACE_ALL|REPLACE_LINES:\d+-\d+)\s*-->\s*```r?\s*\n[\s\S]*?```/g, '')
        .trim();

      // Legacy: Extract any remaining unmarked code blocks as suggestedCode
      const codeBlockMatch = messageText.match(/```r?\n([\s\S]*?)\n```/);
      const suggestedCode = codeBlockMatch && codeBlocks.length === 0 ? codeBlockMatch[1].trim() : undefined;

      return {
        message: cleanMessage,
        suggestedCode,
        codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return this.formatError(error, 'OpenAI');
    }
  }

  private async getClaudeCompletion(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);

      const response = await this.anthropicClient!.messages.create({
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

      // Parse code blocks with special markers
      const codeBlocks = this.parseCodeBlocks(messageText);

      // Remove marked code blocks from message for cleaner display
      const cleanMessage = messageText
        .replace(/<!--\s*(REPLACE_ALL|REPLACE_LINES:\d+-\d+)\s*-->\s*```r?\s*\n[\s\S]*?```/g, '')
        .trim();

      // Legacy: Extract any remaining unmarked code blocks as suggestedCode
      const codeBlockMatch = messageText.match(/```r?\n([\s\S]*?)\n```/);
      const suggestedCode = codeBlockMatch && codeBlocks.length === 0 ? codeBlockMatch[1].trim() : undefined;

      return {
        message: cleanMessage,
        suggestedCode,
        codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error('Claude API error:', error);
      return this.formatError(error, 'Claude');
    }
  }

  private formatError(error: any, providerName: string): AIResponse {
    let errorMessage = `❌ Error communicating with ${providerName}`;

    // Handle authentication errors
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      errorMessage = `🔐 Authentication failed. Please check your ${providerName === 'OpenAI' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'}.`;
    }
    // Handle rate limits
    else if (error?.status === 429) {
      errorMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
    }
    // Handle credit/quota errors
    else if (error?.error?.type === 'invalid_request_error' || error?.code === 'insufficient_quota') {
      if (error.error?.message?.includes('credit balance') || error.message?.includes('quota')) {
        errorMessage = `💳 ${providerName} API credit balance is too low. Please add credits to your account.\n\nVisit: ${providerName === 'OpenAI' ? 'https://platform.openai.com/account/billing' : 'https://console.anthropic.com/settings/plans'}`;
      } else {
        errorMessage = `⚠️ Invalid request: ${error.error?.message || error.message}`;
      }
    }
    // Generic errors
    else if (error instanceof Error) {
      errorMessage = `❌ ${error.message}`;
    }

    return {
      message: errorMessage,
      timestamp: Date.now()
    };
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

    prompt += 'INSTRUCTIONS:\n';
    prompt += '1. Analyze if the user\'s request requires code modification\n';
    prompt += '2. If code modification is needed, provide the code with special markers:\n\n';
    prompt += 'To REPLACE the entire editor content:\n';
    prompt += '<!-- REPLACE_ALL -->\n';
    prompt += '```r\n';
    prompt += 'complete new code here\n';
    prompt += '```\n\n';
    prompt += 'To REPLACE specific lines (e.g., lines 5-8):\n';
    prompt += '<!-- REPLACE_LINES:5-8 -->\n';
    prompt += '```r\n';
    prompt += 'code for those lines\n';
    prompt += '```\n\n';
    prompt += '3. Explain what the code does and why it solves the problem\n';
    prompt += '4. Include comments in the code for clarity\n';
    prompt += '5. If the question doesn\'t need code changes, just provide a helpful answer\n';

    return prompt;
  }

  private parseCodeBlocks(responseText: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];

    // Match patterns like:
    // <!-- REPLACE_ALL --> or <!-- REPLACE_LINES:5-8 -->
    // followed by ```r ... ```
    const pattern = /<!--\s*(REPLACE_ALL|REPLACE_LINES:(\d+)-(\d+))\s*-->\s*```r?\s*\n([\s\S]*?)```/g;

    let match;
    let blockIndex = 0;
    while ((match = pattern.exec(responseText)) !== null) {
      const [, action, startLine, endLine, code] = match;

      blocks.push({
        id: `block_${Date.now()}_${blockIndex++}`,
        code: code.trim(),
        language: 'r',
        action: action === 'REPLACE_ALL' ? 'replace-all' : 'replace-lines',
        targetLines: action !== 'REPLACE_ALL' ? {
          start: parseInt(startLine, 10),
          end: parseInt(endLine, 10)
        } : undefined
      });
    }

    return blocks;
  }

  isConfigured(): boolean {
    if (this.provider === 'openai') {
      return this.openaiClient !== null;
    } else {
      return this.anthropicClient !== null;
    }
  }

  getProviderInfo(): { provider: string; model: string } {
    return {
      provider: this.provider,
      model: this.provider === 'openai' ? this.openaiModel : 'claude-3-5-sonnet-20241022'
    };
  }
}
