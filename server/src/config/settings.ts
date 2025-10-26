import { loadEnv, type Env } from './env';

export class AppConfig {
  private static instance: AppConfig | null = null;

  readonly env: Env;

  private constructor() {
    this.env = loadEnv();
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  get port(): number {
    return this.env.PORT;
  }

  get clientUrl(): string {
    return this.env.CLIENT_URL;
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get aiProvider(): Env['AI_PROVIDER'] {
    return this.env.AI_PROVIDER;
  }

  get openaiApiKey(): string | undefined {
    return this.env.OPENAI_API_KEY;
  }

  get anthropicApiKey(): string | undefined {
    return this.env.ANTHROPIC_API_KEY;
  }

  get openaiModel(): string {
    return this.env.OPENAI_MODEL;
  }

  get openaiBaseUrl(): string | undefined {
    return this.env.OPENAI_BASE_URL;
  }

  get rPath(): string {
    return this.env.R_PATH;
  }

  get tempDir(): string {
    return this.env.TEMP_DIR;
  }
}
