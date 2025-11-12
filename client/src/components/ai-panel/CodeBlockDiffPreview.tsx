import { useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useStore } from '@/core';
import type { CodeBlock, CodeRange } from '@shared/types';

interface Props {
  codeBlock: CodeBlock;
}

function sliceContent(content: string, range: CodeRange): string {
  const lines = content.split(/\r?\n/);
  const startIdx = Math.max(range.startLine - 1, 0);
  const endIdx = Math.min(range.endLine, lines.length);
  const selected = lines.slice(startIdx, endIdx);

  if (selected.length === 0) {
    return '';
  }

  const first = selected[0];
  const last = selected[selected.length - 1];

  selected[0] = first.slice(Math.max(range.startColumn - 1, 0));
  selected[selected.length - 1] = last.slice(0, Math.max(range.endColumn - 1, 0));

  return selected.join('\n');
}

export function CodeBlockDiffPreview({ codeBlock }: Props): JSX.Element | null {
  const editorContent = useStore((state) => state.editor.content);
  const editorFilepath = useStore((state) => state.editor.filepath);

  const { baseline, isStale } = useMemo(() => {
    const localSlice =
      codeBlock.targetRange && (!codeBlock.filepath || codeBlock.filepath === editorFilepath)
        ? sliceContent(editorContent, codeBlock.targetRange)
        : null;

    const original = codeBlock.originalCode ?? localSlice;
    const stale = Boolean(codeBlock.originalCode && localSlice && codeBlock.originalCode !== localSlice);

    return {
      baseline: original,
      isStale: stale,
    };
  }, [codeBlock, editorContent, editorFilepath]);

  if (!baseline) {
    return null;
  }

  return (
    <div className="code-diff-preview" data-testid="code-diff-preview">
      {isStale && (
        <div className="code-diff-warning" data-testid="code-diff-warning" role="status">
          ⚠️ Editor content changed since this suggestion was generated.
        </div>
      )}
      <DiffEditor
        height="240px"
        original={baseline}
        modified={codeBlock.code}
        theme="vs"
        language={codeBlock.language}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          renderSideBySide: false,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
