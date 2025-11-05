import { useState, useRef, useEffect } from 'react';
import { IconRobot, IconSend, IconSquare } from '@/components/shared';
import { useStore } from '@/core';
import { socketService } from '@/services/socket';
import type { WSResponse } from '@/services/socket';
import { CodeBlockWithApply } from './CodeBlockWithApply';
import type { CodeBlock } from '@shared/types';

// Extract code blocks from markdown text
function extractCodeBlocks(text: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const codeBlockRegex = /```(?:r|R)?\n([\s\S]*?)\n```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const code = match[1];
    codeBlocks.push({
      id: `code-${Date.now()}-${index}`,
      code,
      language: 'r',
      action: 'replace-all', // Default action
    });
    index++;
  }

  return codeBlocks;
}

export function AIPanel(): JSX.Element {
  const ai = useStore((state) => state.ai);
  const addAIMessage = useStore((state) => state.addAIMessage);
  const setAILoading = useStore((state) => state.setAILoading);
  const applyCodeChange = useStore((state) => state.applyCodeChange);
  const editorContent = useStore((state) => state.editor.content);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Include editor content as context in the first message
    const userMessageWithContext = ai.messages.length === 0
      ? `Current R code in editor:\n\`\`\`r\n${editorContent}\n\`\`\`\n\n${input}`
      : input;

    const messages = [
      ...ai.messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      { role: 'user' as const, content: userMessageWithContext }
    ];

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

    const matcher = (message: WSResponse) =>
      message.type === 'ai_response' ||
      message.type === 'ai_response_with_tools' ||
      message.type === 'error';

    const sent = socketService.send(
      {
        type: 'ai_message',
        messages,
        enable_tools: true
      },
      (response: WSResponse) => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        if (response.type === 'ai_response') {
          console.log('AI Response received:', response.response);
          const codeBlocks = extractCodeBlocks(response.response);
          console.log('Extracted code blocks:', codeBlocks);
          addAIMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: response.response,
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
            timestamp: Date.now()
          });
        } else if (response.type === 'ai_response_with_tools') {
          // Handle AI response with tool calls
          let content: string;

          if (typeof response.response === 'string') {
            content = response.response;
          } else if (response.response.content) {
            content = response.response.content;
          } else if (response.response.tool_calls && response.response.tool_calls.length > 0) {
            // Format tool calls in a user-friendly way
            const toolCallsFormatted = response.response.tool_calls
              .map((tc, idx) => `${idx + 1}. **${tc.name}**\n   Input: \`${JSON.stringify(tc.input)}\``)
              .join('\n\n');
            content = `🔧 Executing tools:\n\n${toolCallsFormatted}`;
          } else {
            content = 'AI response received (no content)';
          }

          console.log('AI Response with tools content:', content);
          const codeBlocks = extractCodeBlocks(content);
          console.log('Extracted code blocks from tools response:', codeBlocks);

          addAIMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content,
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
            timestamp: Date.now()
          });
        } else if (response.type === 'error') {
          addAIMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: `AI request failed: ${response.message}`,
            timestamp: Date.now()
          });
        }

        setAILoading(false);
      },
      matcher
    );

    if (!sent) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      setAILoading(false);
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'AI request failed: not connected to backend service.',
        timestamp: Date.now()
      });
    }

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
                  {message.codeBlocks && message.codeBlocks.length > 0 && (
                    console.log(`Rendering ${message.codeBlocks.length} code blocks for message ${message.id}`),
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
