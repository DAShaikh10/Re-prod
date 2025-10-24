import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OPENAI_BASE_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  R_PATH: z.string().default('Rscript'),
  TEMP_DIR: z.string().default('./temp')
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const err of result.error.errors) {
      console.error(`  ${err.path.join('.') || '(root)'}: ${err.message}`);
    }
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}

