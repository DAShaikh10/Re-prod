import { useState } from 'react';
import { IconClipboard, IconCheck, IconLightbulb } from '@/components/shared';
import { CodeBlockDiffPreview } from './CodeBlockDiffPreview';
import type { CodeBlock } from '@shared/types';

interface Props {
  codeBlock: CodeBlock;
  onApply: (codeBlock: CodeBlock) => Promise<void>;
}

export function CodeBlockWithApply({ codeBlock, onApply }: Props): JSX.Element {
  const [applied, setApplied] = useState(false);

  const handleApply = async (): Promise<void> => {
    try {
      await onApply(codeBlock);
      setApplied(true);
    } catch (error) {
      console.error('Failed to apply code block', error);
    }
  };

  const handleCopy = (): void => {
    navigator.clipboard.writeText(codeBlock.code);
  };

  const getActionLabel = (): string => {
    const targetFile = codeBlock.filepath ? codeBlock.filepath : 'active editor';

    if (codeBlock.action === 'replace-all') {
      return `Replace entire ${targetFile}`;
    }

    if (codeBlock.action === 'replace-range' && codeBlock.targetRange) {
      const { startLine, startColumn, endLine, endColumn } = codeBlock.targetRange;
      return `Replace ${targetFile} ${startLine}:${startColumn}-${endLine}:${endColumn}`;
    }

    if (codeBlock.action === 'delete-range' && codeBlock.targetRange) {
      const { startLine, endLine } = codeBlock.targetRange;
      return `Delete ${targetFile} lines ${startLine}-${endLine}`;
    }

    if (codeBlock.action === 'create-file' && codeBlock.filepath) {
      return `Create file ${codeBlock.filepath}`;
    }

    if (codeBlock.action === 'insert-at-cursor') {
      return `Insert at cursor in ${targetFile}`;
    }

    return 'Apply suggested change';
  };

  return (
    <div className="code-block-container">
      {codeBlock.explanation && (
        <div className="code-explanation">
          <IconLightbulb width={16} height={16} aria-hidden />
          <span>{codeBlock.explanation}</span>
        </div>
      )}

      <div className="code-block">
        <div className="code-header">
          <span className="code-language">R</span>
          <span className="code-target">
            {codeBlock.filepath ? `${codeBlock.filepath}` : 'Current file'} • {getActionLabel()}
          </span>
        </div>

        <CodeBlockDiffPreview codeBlock={codeBlock} />

        <pre className="code-content">
          <code>{codeBlock.code}</code>
        </pre>

        <div className="code-actions">
          <button
            className="btn"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <>
              <IconClipboard width={16} height={16} aria-hidden />
              Copy
            </>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={applied}
            title={applied ? 'Already applied' : 'Apply to editor'}
          >
            {applied ? (
              <>
                <IconCheck width={16} height={16} aria-hidden />
                Applied
              </>
            ) : (
              <>
                <IconCheck width={16} height={16} aria-hidden />
                Apply to Editor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
