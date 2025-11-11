import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/core';
import { socketService } from '@/services/socket';
import type { WSResponse } from '@/services/socket';
import { extractCodeBlocks } from '@/core/ai/codeBlockUtils';
import type { AIMessage, CodeBlock } from '@shared/types';

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

  const postAssistantMessage = useCallback(
    (content: string, extras?: Partial<AIMessage>) => {
      const timestamp = Date.now();
      addAIMessage({
        id: timestamp.toString(),
        role: 'assistant',
        content,
        timestamp,
        ...extras,
      });
    },
    [addAIMessage],
  );

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

    postAssistantMessage('Request stopped by user.');
  }, [clearTimeoutRef, postAssistantMessage, setAILoading]);

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
      postAssistantMessage('Request timed out. The AI service took too long to respond. Please try again.');
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
          postAssistantMessage(response.response, {
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
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
          postAssistantMessage(content, {
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
          });
        } else if (response.type === 'error') {
          postAssistantMessage(`AI request failed: ${response.message}`);
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
      postAssistantMessage('AI request failed: not connected to backend service.');
    }

    setInput('');
  }, [addAIMessage, clearTimeoutRef, editorContent, input, messages, postAssistantMessage, setAILoading]);

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
