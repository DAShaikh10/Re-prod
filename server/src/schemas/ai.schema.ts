import { z } from 'zod';
import { executionResultSchema } from './execution.schema';

const cursorPositionSchema = z.object({
  line: z.number().int().min(1),
  column: z.number().int().min(1)
});

const codeBlockTargetSchema = z.object({
  start: z.number().int().min(1),
  end: z.number().int().min(1)
});

export const codeBlockSchema = z.object({
  id: z.string(),
  code: z.string(),
  language: z.literal('r'),
  action: z.enum(['replace-all', 'replace-lines', 'insert-at-cursor']),
  targetLines: codeBlockTargetSchema.optional(),
  explanation: z.string().optional()
});

const aiContextSchema = z.object({
  executionHistory: z.array(executionResultSchema).optional(),
  cursorPosition: cursorPositionSchema.optional(),
  lastError: z.string().optional(),
  selectedText: z.string().optional()
});

export const aiRequestSchema = z.object({
  code: z.string().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
  context: aiContextSchema.optional()
});

export const aiResponseSchema = z.object({
  message: z.string(),
  suggestedCode: z.string().optional(),
  codeBlocks: z.array(codeBlockSchema).optional(),
  explanation: z.string().optional(),
  timestamp: z.number()
});

export type AIRequestInput = z.infer<typeof aiRequestSchema>;
export type AIResponseOutput = z.infer<typeof aiResponseSchema>;
