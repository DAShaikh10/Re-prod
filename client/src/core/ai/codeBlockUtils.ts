import type { CodeBlock } from '@shared/types';

const CODE_BLOCK_REGEX = /```(?:r|R)?\n([\s\S]*?)\n```/g;

export function extractCodeBlocks(text: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = CODE_BLOCK_REGEX.exec(text)) !== null) {
    codeBlocks.push({
      id: `code-${Date.now()}-${index}`,
      code: match[1],
      language: 'r',
      action: 'replace-all',
    });
    index += 1;
  }

  return codeBlocks;
}
