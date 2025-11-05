import React from 'react';

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCalls }) => {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const getToolIcon = (toolName: string): string => {
    switch (toolName) {
      case 'read_file':
        return '📖';
      case 'write_file':
        return '✍️';
      case 'list_files':
        return '📁';
      case 'get_r_variables':
        return '🔢';
      case 'get_working_directory':
        return '📂';
      case 'get_installed_packages':
        return '📦';
      default:
        return '🔧';
    }
  };

  const getToolLabel = (toolName: string): string => {
    switch (toolName) {
      case 'read_file':
        return 'Reading File';
      case 'write_file':
        return 'Writing File';
      case 'list_files':
        return 'Listing Files';
      case 'get_r_variables':
        return 'Getting R Variables';
      case 'get_working_directory':
        return 'Getting Working Directory';
      case 'get_installed_packages':
        return 'Getting Installed Packages';
      default:
        return 'Tool Call';
    }
  };

  const formatInput = (input: Record<string, unknown>): string => {
    const entries = Object.entries(input);
    if (entries.length === 0) return '';

    return entries
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(', ');
  };

  return (
    <div className="tool-calls-container">
      {toolCalls.map((toolCall) => (
        <div key={toolCall.id} className="tool-call-item">
          <div className="tool-call-header">
            <span className="tool-icon">{getToolIcon(toolCall.name)}</span>
            <span className="tool-label">{getToolLabel(toolCall.name)}</span>
          </div>
          {Object.keys(toolCall.input).length > 0 && (
            <div className="tool-call-input">
              <code>{formatInput(toolCall.input)}</code>
            </div>
          )}
        </div>
      ))}
      <style>{`
        .tool-calls-container {
          margin: 8px 0;
          padding: 12px;
          background-color: #f5f5f5;
          border-left: 3px solid #4a90e2;
          border-radius: 4px;
        }

        .tool-call-item {
          margin-bottom: 8px;
        }

        .tool-call-item:last-child {
          margin-bottom: 0;
        }

        .tool-call-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #333;
        }

        .tool-icon {
          font-size: 18px;
        }

        .tool-label {
          font-size: 14px;
        }

        .tool-call-input {
          margin-top: 4px;
          padding: 6px 8px;
          background-color: #fff;
          border-radius: 3px;
          font-size: 12px;
        }

        .tool-call-input code {
          font-family: 'Courier New', monospace;
          color: #666;
        }

        @media (prefers-color-scheme: dark) {
          .tool-calls-container {
            background-color: #2a2a2a;
            border-left-color: #6ba3e8;
          }

          .tool-call-header {
            color: #e0e0e0;
          }

          .tool-call-input {
            background-color: #1a1a1a;
          }

          .tool-call-input code {
            color: #b0b0b0;
          }
        }
      `}</style>
    </div>
  );
};

export default ToolCallDisplay;
