import { z } from 'zod';

const plotInfoSchema = z.object({
  id: z.string(),
  path: z.string(),
  data: z.string(),
  timestamp: z.number()
});

export const executionRequestSchema = z.object({
  code: z.string().min(1, 'Code is required')
});

export const executionResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  plots: z.array(plotInfoSchema),
  timestamp: z.number(),
  duration: z.number(),
  success: z.boolean()
});

export const executionErrorSchema = z.object({
  message: z.string(),
  type: z.enum(['syntax', 'runtime', 'system']),
  line: z.number().optional(),
  timestamp: z.number(),
  success: z.literal(false)
});

export type ExecutionRequestInput = z.infer<typeof executionRequestSchema>;
export type ExecutionResultInput = z.infer<typeof executionResultSchema>;
export type ExecutionErrorInput = z.infer<typeof executionErrorSchema>;
