import { useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { IconPlay, IconPlayCircle } from "@/components/shared";
import { useStore } from "@/core";
import { useEditorCells } from "@/hooks/useEditorCells";
import { useEditorDecorations } from "@/hooks/useEditorDecorations";
import { useEditorExecution } from "@/hooks/useEditorExecution";
import type { editor as MonacoEditor } from "monaco-editor";
import type { CodeBlock, CodeRange } from "@shared/types";

export function EditorPanel(): JSX.Element {
  const editor = useStore((state) => state.editor);
  const execution = useStore((state) => state.execution);
  const settings = useStore((state) => state.settings);
  const setEditorContent = useStore((state) => state.setEditorContent);
  const setEditorCursorPosition = useStore((state) => state.setEditorCursorPosition);
  const setApplyCodeChange = useStore((state) => state.setApplyCodeChange);
  const setRunCurrentCell = useStore((state) => state.setRunCurrentCell);
  const setRunAll = useStore((state) => state.setRunAll);
  const setMonacoEditor = useStore((state) => state.setMonacoEditor);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const cells = useEditorCells(editor.content, editor.filepath);
  const {
    executingCellIndex,
    handleRunAll,
    handleRunCurrentCell,
    handleRunCellAndMoveNext,
  } = useEditorExecution({ editorRef, cells });

  useEditorDecorations(editorRef, cells, {
    showCellDecorations: settings.showCellDecorations,
    highlightExecutingCell: settings.highlightExecutingCell,
    executingCellIndex,
  });

  const handleEditorChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setEditorContent(value);
    }
  };

  // Apply code changes from AI
  const applyCodeChange = useCallback(async (codeBlock: CodeBlock): Promise<void> => {
    const monacoEditor = editorRef.current;
    if (!monacoEditor) {
      console.error("Editor not ready");
      return;
    }

    const model = monacoEditor.getModel();
    if (!model) return;

    const clampLine = (line: number): number =>
      Math.min(Math.max(line, 1), model.getLineCount());

    const clampColumn = (line: number, column?: number): number => {
      const maxColumn = model.getLineMaxColumn(line);
      if (!column || column < 1) {
        return 1;
      }
      return Math.min(column, maxColumn);
    };

    const toMonacoRange = (targetRange: CodeRange): MonacoEditor.IRange => {
      const startLineNumber = clampLine(targetRange.startLine);
      const endLineNumber = clampLine(targetRange.endLine);

      return {
        startLineNumber,
        startColumn: clampColumn(startLineNumber, targetRange.startColumn),
        endLineNumber,
        endColumn: clampColumn(endLineNumber, targetRange.endColumn),
      };
    };

    const applyRangeEdit = (targetRange: CodeRange, text: string): void => {
      const range = toMonacoRange(targetRange);
      monacoEditor.executeEdits("ai-apply", [
        {
          range,
          text,
        },
      ]);
      setEditorContent(monacoEditor.getValue());
    };

    switch (codeBlock.action) {
      case "replace-all":
        monacoEditor.setValue(codeBlock.code);
        setEditorContent(codeBlock.code);
        break;
      case "replace-range":
        if (codeBlock.targetRange) {
          applyRangeEdit(codeBlock.targetRange, codeBlock.code);
        } else {
          console.warn("Missing target range for replace-range");
        }
        break;
      case "delete-range":
        if (codeBlock.targetRange) {
          applyRangeEdit(codeBlock.targetRange, "");
        } else {
          console.warn("Missing target range for delete-range");
        }
        break;
      case "insert-at-cursor": {
        const position = monacoEditor.getPosition();
        if (position) {
          monacoEditor.executeEdits("ai-insert", [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
              text: codeBlock.code,
            },
          ]);
          setEditorContent(monacoEditor.getValue());
        }
        break;
      }
      case "create-file":
        console.info("create-file action will be handled by file service");
        break;
      default:
        console.warn("Unknown code block action", codeBlock.action);
    }
  };

  useEffect(() => {
    setApplyCodeChange(applyCodeChange);
  }, [applyCodeChange, setApplyCodeChange]);

  useEffect(() => {
    setRunCurrentCell(handleRunCurrentCell);
    setRunAll(handleRunAll);
  }, [handleRunCurrentCell, handleRunAll, setRunCurrentCell, setRunAll]);

  const handleEditorDidMount = (
    monacoEditor: MonacoEditor.IStandaloneCodeEditor,
    monaco: Monaco,
  ): void => {
    editorRef.current = monacoEditor;
    setMonacoEditor(monacoEditor);

    // Track cursor position
    monacoEditor.onDidChangeCursorPosition((e) => {
      setEditorCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Keyboard shortcuts
    // Cmd/Ctrl + Enter: Run current cell
    monacoEditor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        handleRunCurrentCell();
      },
    );

    // Shift + Enter: Run current cell and move to next
    monacoEditor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      handleRunCellAndMoveNext();
    });

    // Cmd/Ctrl + Shift + Enter: Run all
    monacoEditor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        handleRunAll();
      },
    );
  };

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <div className="panel-title">
          {editor.filepath || "Untitled.R"}
          {editor.isDirty && <span className="dirty-marker"> •</span>}
        </div>
        <div className="panel-actions">
          <button
            className="btn"
            onClick={handleRunCurrentCell}
            disabled={execution.isRunning}
            title="Run Current Cell (Cmd/Ctrl+Enter)"
          >
            <IconPlay width={16} height={16} aria-hidden />
            Run Selection
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
              <>
                <IconPlayCircle width={16} height={16} aria-hidden />
                Run All
              </>
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
            fontFamily: "Monaco, Menlo, Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            renderWhitespace: "selection",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            },
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}
