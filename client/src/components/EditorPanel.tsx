import Editor from '@monaco-editor/react';
import { useStore } from '../store/useStore';
import { socketService } from '../services/socket';
import './EditorPanel.css';

export function EditorPanel(): JSX.Element {
  const { editor, setEditorContent, setCursorPosition, setIsRunning, execution } = useStore();

  const handleEditorChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setEditorContent(value);
    }
  };

  const handleRunCode = (): void => {
    const socket = socketService.getSocket();
    setIsRunning(true);

    socket.emit('execute', editor.content, (result) => {
      // Result will be handled by the socket listener in App.tsx
      console.log('Execution completed');
    });
  };

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <div className="panel-title">
          {editor.filepath || 'Untitled.R'}
          {editor.isDirty && <span className="dirty-marker"> •</span>}
        </div>
        <div className="panel-actions">
          <button
            className="btn btn-primary"
            onClick={handleRunCode}
            disabled={execution.isRunning}
          >
            {execution.isRunning ? (
              <>
                <div className="spinner"></div>
                Running
              </>
            ) : (
              <>▶ Run</>
            )}
          </button>
        </div>
      </div>
      <div className="panel-content">
        <Editor
          height="100%"
          defaultLanguage="r"
          theme="vs"
          value={editor.content}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            fontFamily: 'Monaco, Menlo, Consolas, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12
            }
          }}
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((e) => {
              setCursorPosition({
                line: e.position.lineNumber,
                column: e.position.column
              });
            });
          }}
        />
      </div>
    </div>
  );
}
