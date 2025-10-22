import { useState } from 'react';
import { IconClipboard, IconCheck, IconLightbulb } from './icons';
import type { CodeBlock } from '../../../shared/src/types';
import './CodeBlockWithApply.css';

interface Props {
  codeBlock: CodeBlock;
  onApply: (codeBlock: CodeBlock) => void;
}

export function CodeBlockWithApply({ codeBlock, onApply }: Props): JSX.Element {
  const [applied, setApplied] = useState(false);

  const handleApply = (): void => {
    onApply(codeBlock);
    setApplied(true);
  };

  const handleCopy = (): void => {
    navigator.clipboard.writeText(codeBlock.code);
  };

  const getActionLabel = (): string => {
    if (codeBlock.action === 'replace-all') {
      return 'Replace all editor content';
    } else if (codeBlock.action === 'replace-lines' && codeBlock.targetLines) {
      return `Replace lines ${codeBlock.targetLines.start}-${codeBlock.targetLines.end}`;
    }
    return 'Insert at cursor';
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
          <span className="code-target">{getActionLabel()}</span>
        </div>

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
