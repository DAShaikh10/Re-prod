import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { socketService } from '../services/socket';
import './AIPanel.css';

export function AIPanel(): JSX.Element {
  const { ai, editor, addAIMessage, setAILoading, setEditorContent } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        content: '⏱️ Request timeout. The AI service took too long to respond. Please try again.',
        timestamp: Date.now()
      });
    }, 30000);

    const socket = socketService.getSocket();
    socket.emit('ai-request', {
      code: editor.content,
      prompt: input,
      context: {
        cursorPosition: editor.cursorPosition
      }
    }, (response) => {
      // Clear timeout
      clearTimeout(timeoutId);

      // Add AI response (including errors)
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        code: response.suggestedCode,
        timestamp: response.timestamp
      });
      setAILoading(false);
    });

    setInput('');
  };

  const handleApplyCode = (code: string): void => {
    setEditorContent(editor.content + '\n\n' + code);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
          {ai.messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">🤖</div>
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
                  {message.code && (
                    <div className="message-code">
                      <pre><code>{message.code}</code></pre>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApplyCode(message.code!)}
                      >
                        Apply to Editor
                      </button>
                    </div>
                  )}
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
          <input
            type="text"
            className="ai-input"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={ai.isLoading}
          />
          <button
            className="btn btn-primary"
            onClick={handleAsk}
            disabled={ai.isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
