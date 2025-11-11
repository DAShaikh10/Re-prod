import { useRef, useEffect } from 'react';
import { IconSend, IconSquare } from '@/components/shared';
import { CodeBlockWithApply } from './CodeBlockWithApply';
import type { CodeBlock } from '@shared/types';
import { useAIConversation } from '@/hooks/useAIConversation';

export function AIPanel(): JSX.Element {
  const {
    input,
    setInput,
    messages,
    isLoading,
    handleAsk,
    handleStop,
    handleApplyCode,
  } = useAIConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="panel ai-panel">
      <div className="panel-header">
        <div className="panel-title">AI Assistant</div>
      </div>
      <div className="panel-content">
        <div className="ai-messages">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <h3>AI Assistant</h3>
              <p>Ask me anything about R programming, data analysis, or visualization.</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`message message-${message.role}`}>
                  <div className="message-header">
                    <span className="message-role">
                      {message.role === 'user' ? 'You' : 'AI'}
                    </span>
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                  {/* Legacy code display */}
                  {message.code && !message.codeBlocks && (
                    <div className="message-code">
                      <pre><code>{message.code}</code></pre>
                    </div>
                  )}
                  {/* New code blocks with Apply buttons */}
                  {message.codeBlocks && message.codeBlocks.length > 0 && (
                    message.codeBlocks.map((codeBlock: CodeBlock) => (
                      <CodeBlockWithApply
                        key={codeBlock.id}
                        codeBlock={codeBlock}
                        onApply={handleApplyCode}
                      />
                    ))
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="message message-assistant">
                  <div className="message-header">
                    <span className="message-role">AI</span>
                  </div>
                  <div className="message-content">
                    <div className="spinner"></div>
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        <div className="ai-input-container">
          <textarea
            className="ai-input"
            placeholder="Ask a question... (Enter to send, Shift/Alt+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={3}
          />
          {isLoading ? (
            <button
              className="btn btn-stop"
              onClick={handleStop}
              title="Stop generation"
            >
              <>
                <IconSquare width={16} height={16} aria-hidden />
                Stop
              </>
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleAsk}
              disabled={!input.trim()}
              title="Send message (Enter)"
            >
              <>
                <IconSend width={16} height={16} aria-hidden />
                Send
              </>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
