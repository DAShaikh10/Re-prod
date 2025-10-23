import { useState, useRef, useEffect } from 'react';
import { IconRobot, IconSend, IconSquare } from './icons';
import { useStore } from '../store/useStore';
import { socketService } from '../services/socket';
import { CodeBlockWithApply } from './CodeBlockWithApply';
import type { CodeBlock } from '../../../shared/src/types';

export function AIPanel(): JSX.Element {
  const { ai, editor, execution, addAIMessage, setAILoading } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ai.messages]);

  const handleAsk = (): void => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now()
    };

    addAIMessage(userMessage);
    setAILoading(true);

    // Safety timeout - clear loading state if no response in 30 seconds
    const timeoutId = setTimeout(() => {
      setAILoading(false);
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Request timed out. The AI service took too long to respond. Please try again.',
        timestamp: Date.now()
      });
      timeoutIdRef.current = null;
    }, 30000);

    // Store timeout ID for stop functionality
    timeoutIdRef.current = timeoutId;

    const socket = socketService.getSocket();

    // Get last error from execution history
    const lastError = execution.history.length > 0
      ? execution.history[execution.history.length - 1].stderr
      : undefined;

    socket.emit('ai-request', {
      code: editor.content,
      prompt: input,
      context: {
        cursorPosition: editor.cursorPosition,
        executionHistory: execution.history.slice(-3), // Last 3 executions
        lastError: lastError && lastError.trim().length > 0 ? lastError : undefined
      }
    }, (response) => {
      // Clear timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      // Add AI response (including errors)
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        code: response.suggestedCode,
        codeBlocks: response.codeBlocks,
        timestamp: response.timestamp
      });
      setAILoading(false);
    });

    setInput('');
  };

  const handleStop = (): void => {
    // Clear timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Stop loading
    setAILoading(false);

    // Add stopped message
    addAIMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Request stopped by user.',
      timestamp: Date.now()
    });
  };

  const handleApplyCode = (codeBlock: CodeBlock): void => {
    // This will be connected to EditorPanel's applyCodeChange method
    const { applyCodeChange } = useStore.getState();
    if (applyCodeChange) {
      applyCodeChange(codeBlock);
    } else {
      // Fallback: just append to end for now
      console.warn('applyCodeChange not available, using fallback');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter without modifiers -> Send
    // Shift + Enter or Alt/Option + Enter -> New line
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      handleAsk();
    }
    // Shift+Enter or Alt+Enter -> allow default (new line)
  };

  return (
    <div className="panel ai-panel">
      <div className="panel-header">
        <div className="panel-title">AI Assistant</div>
      </div>
      <div className="panel-content">
        <div className="ai-messages">
          {ai.messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <IconRobot width={48} height={48} aria-hidden />
              </div>
              <h3>AI Assistant</h3>
              <p>Ask me anything about R programming, data analysis, or visualization.</p>
            </div>
          ) : (
            <>
              {ai.messages.map((message) => (
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
                  {message.codeBlocks && message.codeBlocks.map((codeBlock) => (
                    <CodeBlockWithApply
                      key={codeBlock.id}
                      codeBlock={codeBlock}
                      onApply={handleApplyCode}
                    />
                  ))}
                </div>
              ))}
              {ai.isLoading && (
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
            disabled={ai.isLoading}
            rows={3}
          />
          {ai.isLoading ? (
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
