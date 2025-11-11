import { useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { IconPlay, IconPlayCircle } from "@/components/shared";
import { useStore } from "@/core";
import { useEditorCells } from "@/hooks/useEditorCells";
import { useEditorDecorations } from "@/hooks/useEditorDecorations";
import { useEditorExecution } from "@/hooks/useEditorExecution";
import type { editor as MonacoEditor } from "monaco-editor";
import type { CodeBlock } from "@shared/types";

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
  const applyCodeChange = (codeBlock: CodeBlock): void => {
    const monacoEditor = editorRef.current;
    if (!monacoEditor) {
      console.error("Editor not ready");
      return;
    }

    const model = monacoEditor.getModel();
    if (!model) return;

    if (codeBlock.action === "replace-all") {
      // Replace entire editor content
      monacoEditor.setValue(codeBlock.code);
      setEditorContent(codeBlock.code);
    } else if (codeBlock.action === "replace-lines" && codeBlock.targetLines) {
      // Replace specific lines
      const { start, end } = codeBlock.targetLines;

      const range = {
        startLineNumber: start,
        startColumn: 1,
        endLineNumber: end,
        endColumn: model.getLineMaxColumn(end),
      };

      monacoEditor.executeEdits("ai-apply", [
        {
          range: range,
          text: codeBlock.code,
        },
      ]);

      // Update store with new content
      setEditorContent(monacoEditor.getValue());
    } else if (codeBlock.action === "insert-at-cursor") {
      // Insert at current cursor position
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

        // Update store
        setEditorContent(monacoEditor.getValue());
      }
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
