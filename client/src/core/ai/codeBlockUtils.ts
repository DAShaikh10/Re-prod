import type { CodeBlock, CodeChangeAction, CodeRange } from '@shared/types';

const R_CODE_BLOCK_REGEX = /```(?:r|R)\n([\s\S]*?)\n```/g;
const JSON_BLOCK_REGEX = /```json\n([\s\S]*?)\n```/g;

const codeChangeActions: CodeChangeAction[] = [
  'replace-all',
  'replace-range',
  'insert-at-cursor',
  'create-file',
  'delete-range',
];

const makeCodeRange = (raw?: Partial<CodeRange>): CodeRange | undefined => {
  if (!raw) {
    return undefined;
  }

  const range: CodeRange = {
    startLine: Number(raw.startLine) || 0,
    startColumn: Number(raw.startColumn) || 1,
    endLine: Number(raw.endLine) || 0,
    endColumn: Number(raw.endColumn) || 1,
  };

  if (!range.startLine || !range.endLine) {
    return undefined;
  }

  return range;
};

const normalizeCodeBlock = (raw: Record<string, unknown>): CodeBlock | null => {
  const action = typeof raw.action === 'string' && codeChangeActions.includes(raw.action as CodeChangeAction)
    ? (raw.action as CodeChangeAction)
    : 'replace-all';

  const code = typeof raw.code === 'string' ? raw.code : '';
  if (!code) {
    return null;
  }

  const codeBlock: CodeBlock = {
    id: typeof raw.id === 'string' ? raw.id : `code-${Date.now()}-json`,
    code,
    language: 'r',
    action,
    filepath: typeof raw.filepath === 'string' ? raw.filepath : undefined,
    explanation: typeof raw.explanation === 'string' ? raw.explanation : undefined,
    checksum: typeof raw.checksum === 'string' ? raw.checksum : undefined,
    originalCode: typeof raw.originalCode === 'string' ? raw.originalCode : undefined,
  };

  const targetRange = makeCodeRange(raw.targetRange as Partial<CodeRange>);
  if (targetRange) {
    codeBlock.targetRange = targetRange;
  }

  return codeBlock;
};

const parseJsonBlocks = (text: string): { blocks: CodeBlock[]; ranges: Array<{ start: number; end: number }> } => {
  const jsonRanges: Array<{ start: number; end: number }> = [];
  const parsedBlocks: CodeBlock[] = [];

  let match: RegExpExecArray | null;
  while ((match = JSON_BLOCK_REGEX.exec(text)) !== null) {
    const rawJson = match[1];
    const start = match.index;
    const end = match.index + match[0].length;
    jsonRanges.push({ start, end });

    try {
      const parsed = JSON.parse(rawJson);

      if (Array.isArray(parsed)) {
        parsed.forEach((entry: unknown) => {
          if (entry && typeof entry === 'object') {
            const block = normalizeCodeBlock(entry as Record<string, unknown>);
            if (block) {
              parsedBlocks.push(block);
            }
          }
        });
      } else if (parsed && typeof parsed === 'object') {
        if ('codeBlocks' in parsed && Array.isArray((parsed as { codeBlocks: unknown[] }).codeBlocks)) {
          (parsed as { codeBlocks: unknown[] }).codeBlocks.forEach((entry: unknown) => {
            if (entry && typeof entry === 'object') {
              const block = normalizeCodeBlock(entry as Record<string, unknown>);
              if (block) {
                parsedBlocks.push(block);
              }
            }
          });
        } else {
          const block = normalizeCodeBlock(parsed as Record<string, unknown>);
          if (block) {
            parsedBlocks.push(block);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON code block metadata', error);
    }
  }

  return { blocks: parsedBlocks, ranges: jsonRanges };
};

export function extractCodeBlocks(text: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const { blocks: jsonBlocks, ranges: jsonRanges } = parseJsonBlocks(text);
  codeBlocks.push(...jsonBlocks);

  let match: RegExpExecArray | null;
  while ((match = R_CODE_BLOCK_REGEX.exec(text)) !== null) {
    const start = match.index;
    const overlapsJson = jsonRanges.some(({ start: jsonStart, end: jsonEnd }) =>
      start >= jsonStart && start < jsonEnd,
    );

    if (overlapsJson) {
      continue;
    }

    codeBlocks.push({
      id: `code-${Date.now()}-${start}`,
      code: match[1],
      language: 'r',
      action: 'replace-all',
    });
  }

  return codeBlocks;
}
