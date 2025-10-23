import { z } from 'zod';

const filepathSchema = z.string().min(1, 'Filepath is required');

export const watchFileSchema = z.object({
  filepath: filepathSchema
});

export const unwatchFileSchema = z.object({
  filepath: filepathSchema
});

export const saveFileSchema = z.object({
  filepath: filepathSchema,
  content: z.string()
});

export const loadFileSchema = z.object({
  filepath: filepathSchema
});

export const fileChangeSchema = z.object({
  filepath: filepathSchema,
  content: z.string(),
  timestamp: z.number()
});

export type WatchFileInput = z.infer<typeof watchFileSchema>;
export type SaveFileInput = z.infer<typeof saveFileSchema>;
export type LoadFileInput = z.infer<typeof loadFileSchema>;
export type FileChangeOutput = z.infer<typeof fileChangeSchema>;
