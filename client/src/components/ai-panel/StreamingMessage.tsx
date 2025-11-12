import { CodeBlockWithApply } from './CodeBlockWithApply';
import { AIPlanCard } from './AIPlanCard';
import { ToolCallLog } from './ToolCallLog';
import type { AIMessage, CodeBlock } from '@shared/types';

interface Props {
  message: AIMessage;
  onApplyCode: (codeBlock: CodeBlock) => Promise<void>;
}

export function StreamingMessage({ message, onApplyCode }: Props): JSX.Element {
  const isAssistant = message.role === 'assistant';
  const isStreaming = Boolean(message.streamingId && !message.isComplete);
  const hasPlan = Boolean(message.planSteps && message.planSteps.length > 0);
  const hasTools = Boolean(message.toolLogs && message.toolLogs.length > 0);
  const hasCodeBlocks = Boolean(message.codeBlocks && message.codeBlocks.length > 0);
  const shouldShowLegacyCode = Boolean(message.code && !hasCodeBlocks);

  return (
    <div className={`message message-${message.role}`} data-streaming={isStreaming ? 'true' : 'false'}>
      <div className="message-header">
        <span className="message-role">{isAssistant ? 'AI' : 'You'}</span>
      </div>
      <div className="message-content message-streaming">
        {isStreaming && (
          <div className="message-streaming-indicator">
            <span className="spinner" aria-hidden />
            <span>Streaming response…</span>
          </div>
        )}
        {message.content && (
          <pre className="message-streaming-text">{message.content}</pre>
        )}
      </div>

      {isAssistant && (
        <>
          {hasPlan && <AIPlanCard steps={message.planSteps} />}

          {hasTools && <ToolCallLog logs={message.toolLogs} />}

          {shouldShowLegacyCode && (
            <div className="message-code">
              <pre><code>{message.code}</code></pre>
            </div>
          )}

          {hasCodeBlocks &&
            message.codeBlocks!.map((codeBlock) => (
              <CodeBlockWithApply key={codeBlock.id} codeBlock={codeBlock} onApply={onApplyCode} />
            ))}
        </>
      )}
    </div>
  );
}
