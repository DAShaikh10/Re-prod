import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/core';
import { socketService } from '@/services/socket';
import type { WSResponse } from '@/services/socket';
import { extractCodeBlocks } from '@/core/ai/codeBlockUtils';
import type { CodeBlock } from '@shared/types';

const aiResponseMatcher = (message: WSResponse): boolean =>
  message.type === 'ai_response' ||
  message.type === 'ai_response_with_tools' ||
  message.type === 'error';

export function useAIConversation() {
  const messages = useStore((state) => state.ai.messages);
  const isLoading = useStore((state) => state.ai.isLoading);

  const addAIMessage = useStore((state) => state.addAIMessage);
  const setAILoading = useStore((state) => state.setAILoading);
  const applyCodeChange = useStore((state) => state.applyCodeChange);
  const editorContent = useStore((state) => state.editor.content);

  const [input, setInput] = useState('');
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimeoutRef();
    };
  }, [clearTimeoutRef]);

  const handleApplyCode = useCallback((codeBlock: CodeBlock): void => {
    if (applyCodeChange) {
      applyCodeChange(codeBlock);
      return;
    }

    console.warn('applyCodeChange not available, falling back to append mode');
  }, [applyCodeChange]);

  const handleStop = useCallback((): void => {
    clearTimeoutRef();
    setAILoading(false);

    addAIMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Request stopped by user.',
      timestamp: Date.now(),
    });
  }, [addAIMessage, clearTimeoutRef, setAILoading]);

  const handleAsk = useCallback((): void => {
    if (!input.trim()) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
    };

    const messagesWithContext =
      messages.length === 0
        ? `Current R code in editor:\n\`\`\`r\n${editorContent}\n\`\`\`\n\n${input}`
        : input;

    const requestPayload = [
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user' as const, content: messagesWithContext },
    ];

    addAIMessage(userMessage);
    setAILoading(true);

    clearTimeoutRef();

    timeoutIdRef.current = setTimeout(() => {
      setAILoading(false);
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Request timed out. The AI service took too long to respond. Please try again.',
        timestamp: Date.now(),
      });
      timeoutIdRef.current = null;
    }, 30000);

    const matcher = aiResponseMatcher;

    const sent = socketService.send(
      {
        type: 'ai_message',
        messages: requestPayload,
        enable_tools: true,
      },
      (response: WSResponse) => {
        clearTimeoutRef();
        timeoutIdRef.current = null;

        if (response.type === 'ai_response') {
          const codeBlocks = extractCodeBlocks(response.response);
          addAIMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: response.response,
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
            timestamp: Date.now(),
          });
        } else if (response.type === 'ai_response_with_tools') {
          let content: string;

          if (typeof response.response === 'string') {
            content = response.response;
          } else if ('content' in response.response && response.response.content) {
            content = response.response.content;
          } else if (
            'tool_calls' in response.response &&
            response.response.tool_calls &&
            response.response.tool_calls.length > 0
          ) {
            const toolCallsFormatted = response.response.tool_calls
              .map((tc, idx) => `${idx + 1}. **${tc.name}**\n   Input: \`${JSON.stringify(tc.input)}\``)
              .join('\n\n');
            content = `🔧 Executing tools:\n\n${toolCallsFormatted}`;
          } else {
            content = 'AI response received (no content)';
          }

          const codeBlocks = extractCodeBlocks(content);
          addAIMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content,
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
            timestamp: Date.now(),
          });
        } else if (response.type === 'error') {
          addAIMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: `AI request failed: ${response.message}`,
            timestamp: Date.now(),
          });
        }

        setAILoading(false);
      },
      matcher
    );

    if (!sent) {
      if (timeoutIdRef.current) {
        clearTimeoutRef();
        timeoutIdRef.current = null;
      }
      setAILoading(false);
      addAIMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'AI request failed: not connected to backend service.',
        timestamp: Date.now(),
      });
    }

    setInput('');
  }, [addAIMessage, clearTimeoutRef, editorContent, input, messages, setAILoading]);

  return {
    input,
    setInput,
    messages,
    isLoading,
    handleAsk,
    handleStop,
    handleApplyCode,
  };
}
