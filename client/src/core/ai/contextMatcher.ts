import type { CodeRange } from '@shared/types';
import type { PatchChunk } from '@shared/types';

const normalizeLine = (line: string): string => line.trim();

export function seekSequence(
  content: string,
  snippetLines: string[],
  startFromLine = 0,
): number | null {
  if (snippetLines.length === 0) {
    return null;
  }

  const contentLines = content.split(/\r?\n/);

  for (let idx = startFromLine; idx <= contentLines.length - snippetLines.length; idx++) {
    let match = true;
    for (let offset = 0; offset < snippetLines.length; offset++) {
      if (normalizeLine(contentLines[idx + offset]) !== normalizeLine(snippetLines[offset])) {
        match = false;
        break;
      }
    }
    if (match) {
      return idx + 1;
    }
  }

  return null;
}

export function computeTargetRange(
  content: string,
  snippet: string,
): CodeRange | null {
  const snippetLines = snippet
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!snippetLines.length) {
    return null;
  }

  const startLine = seekSequence(content, snippetLines);
  if (startLine === null) {
    return null;
  }

  return {
    startLine,
    startColumn: 1,
    endLine: startLine + snippetLines.length - 1,
    endColumn: 999,
  };
}

export function matchPatchChunk(content: string, chunk: PatchChunk): CodeRange | null {
  const snippet = chunk.oldLines.join('\n');
  const baseRange = computeTargetRange(content, snippet);
  if (baseRange) {
    return baseRange;
  }

  if (chunk.context) {
    const contextLines = chunk.context.replace(/^@@.*@@/, '').trim();
    const contextRange = computeTargetRange(content, contextLines);
    if (contextRange) {
      return contextRange;
    }
  }

  const firstNonEmpty = chunk.oldLines.find((line) => line.trim().length > 0);
  if (firstNonEmpty) {
    const fallbackRange = computeTargetRange(content, firstNonEmpty);
    if (fallbackRange) {
      return fallbackRange;
    }
  }

  return null;
}
