import { useEffect, useState, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { useStore } from '../store/useStore';
import { socketService } from '../services/socket';
import { parseCells, getCurrentCell, getCellCode, type Cell } from '../utils/cellParser';
import type { CodeBlock } from '../../../shared/src/types';
import './EditorPanel.css';

export function EditorPanel(): JSX.Element {
  const { editor, setEditorContent, setCursorPosition, setIsRunning, execution, settings, setApplyCodeChange } = useStore();
  const [cells, setCells] = useState<Cell[]>([]);
  const [executingCellIndex, setExecutingCellIndex] = useState<number | null>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Parse cells when content changes
  useEffect(() => {
    const filename = editor.filepath || 'Untitled.R';
    const parsedCells = parseCells(editor.content, filename);
    setCells(parsedCells);
  }, [editor.content, editor.filepath]);

  // Update decorations when cells change or settings change
  useEffect(() => {
    if (!editorRef.current) return;

    const monacoEditor = editorRef.current;

    // Clear old decorations
    decorationsRef.current = monacoEditor.deltaDecorations(decorationsRef.current, []);

    // Only show decorations if enabled
    if (!settings.showCellDecorations) return;

    const newDecorations: MonacoEditor.IModelDeltaDecoration[] = [];

    cells.forEach((cell, index) => {
      // Add line decoration at section boundaries
      if (cell.startLine > 1) {
        newDecorations.push({
          range: {
            startLineNumber: cell.startLine,
            startColumn: 1,
            endLineNumber: cell.startLine,
            endColumn: 1
          },
          options: {
            isWholeLine: true,
            linesDecorationsClassName: 'cell-boundary-decoration',
            overviewRuler: {
              color: '#4285f4',
              position: 4
            }
          }
        });
      }

      // Highlight executing cell
      if (settings.highlightExecutingCell && executingCellIndex === index) {
        newDecorations.push({
          range: {
            startLineNumber: cell.startLine,
            startColumn: 1,
            endLineNumber: cell.endLine,
            endColumn: 1
          },
          options: {
            isWholeLine: true,
            className: 'executing-cell-background'
          }
        });
      }
    });

    decorationsRef.current = monacoEditor.deltaDecorations([], newDecorations);
  }, [cells, settings.showCellDecorations, settings.highlightExecutingCell, executingCellIndex]);

  const handleEditorChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setEditorContent(value);
    }
  };

  const executeCode = (code: string, cellIndex?: number): void => {
    const socket = socketService.getSocket();
    setIsRunning(true);

    if (cellIndex !== undefined) {
      setExecutingCellIndex(cellIndex);
    }

    socket.emit('execute', code, (result) => {
      // Clear executing state
      setExecutingCellIndex(null);
      setIsRunning(false);

      // Add result to store
      const { addExecutionResult } = useStore.getState();
      addExecutionResult(result);

      console.log('Execution completed');
    });
  };

  const handleRunAll = (): void => {
    executeCode(editor.content);
  };

  const handleRunCurrentCell = (): void => {
    if (cells.length === 0) {
      // No cells, run all
      handleRunAll();
      return;
    }

    const currentCell = getCurrentCell(cells, editor.cursorPosition.line);
    if (currentCell) {
      const cellIndex = cells.indexOf(currentCell);
      const code = getCellCode(currentCell);
      executeCode(code, cellIndex);
    }
  };

  const handleRunCellAndMoveNext = (): void => {
    if (cells.length === 0) {
      handleRunAll();
      return;
    }

    const currentCell = getCurrentCell(cells, editor.cursorPosition.line);
    if (!currentCell) return;

    const cellIndex = cells.indexOf(currentCell);
    const code = getCellCode(currentCell);

    // Execute current cell
    executeCode(code, cellIndex);

    // Move cursor to next cell
    if (cellIndex < cells.length - 1 && editorRef.current) {
      const nextCell = cells[cellIndex + 1];
      editorRef.current.setPosition({
        lineNumber: nextCell.startLine,
        column: 1
      });
      editorRef.current.revealLineInCenter(nextCell.startLine);
    }
  };

  // Apply code changes from AI
  const applyCodeChange = (codeBlock: CodeBlock): void => {
    const monacoEditor = editorRef.current;
    if (!monacoEditor) {
      console.error('Editor not ready');
      return;
    }

    const model = monacoEditor.getModel();
    if (!model) return;

    if (codeBlock.action === 'replace-all') {
      // Replace entire editor content
      monacoEditor.setValue(codeBlock.code);
      setEditorContent(codeBlock.code);

    } else if (codeBlock.action === 'replace-lines' && codeBlock.targetLines) {
      // Replace specific lines
      const { start, end } = codeBlock.targetLines;

      const range = {
        startLineNumber: start,
        startColumn: 1,
        endLineNumber: end,
        endColumn: model.getLineMaxColumn(end)
      };

      monacoEditor.executeEdits('ai-apply', [{
        range: range,
        text: codeBlock.code
      }]);

      // Update store with new content
      setEditorContent(monacoEditor.getValue());

    } else if (codeBlock.action === 'insert-at-cursor') {
      // Insert at current cursor position
      const position = monacoEditor.getPosition();
      if (position) {
        monacoEditor.executeEdits('ai-insert', [{
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          },
          text: codeBlock.code
        }]);

        // Update store
        setEditorContent(monacoEditor.getValue());
      }
    }
  };

  // Register applyCodeChange with store on mount
  useEffect(() => {
    setApplyCodeChange(applyCodeChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorDidMount = (monacoEditor: MonacoEditor.IStandaloneCodeEditor, monaco: Monaco): void => {
    editorRef.current = monacoEditor;

    // Track cursor position
    monacoEditor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // Keyboard shortcuts
    // Cmd/Ctrl + Enter: Run current cell
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCurrentCell();
    });

    // Shift + Enter: Run current cell and move to next
    monacoEditor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      handleRunCellAndMoveNext();
    });

    // Cmd/Ctrl + Shift + Enter: Run all
    monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      handleRunAll();
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
            className="btn"
            onClick={handleRunCurrentCell}
            disabled={execution.isRunning}
            title="Run Current Cell (Cmd/Ctrl+Enter)"
          >
            ▶ Run Cell
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRunAll}
            disabled={execution.isRunning}
            title="Run All (Cmd/Ctrl+Shift+Enter)"
          >
            {execution.isRunning ? (
              <>
                <div className="spinner"></div>
                Running
              </>
            ) : (
              <>▶ Run All</>
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
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}
