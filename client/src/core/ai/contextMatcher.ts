import type { CodeRange } from '@shared/types';

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
  const snippetLines = snippet.split(/\r?\n/).filter((line) => line.length > 0);
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
