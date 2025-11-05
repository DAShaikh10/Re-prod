import type { StateCreator } from 'zustand';
import type { CodeBlock } from '@shared/types';

export interface EditorState {
  editor: {
    content: string;
    filepath: string;
    isDirty: boolean;
    cursorPosition: {
      line: number;
      column: number;
    };
  };
  applyCodeChange: ((codeBlock: CodeBlock) => void) | null;
  setEditorContent: (content: string) => void;
  setEditorFilepath: (filepath: string) => void;
  setEditorCursorPosition: (position: { line: number; column: number }) => void;
  setEditorIsDirty: (isDirty: boolean) => void;
  setApplyCodeChange: (handler: (codeBlock: CodeBlock) => void) => void;
}

export const createEditorSlice: StateCreator<EditorState> = (set) => ({
  editor: {
    content: `# Welcome to Re-prod ----
# AI-Powered R Analysis IDE
# Try Cmd/Ctrl+Enter to run current section
# Try Shift+Enter to run and move to next section

# Load Data ----
data(mtcars)
head(mtcars)

# Summary Statistics ----
summary(mtcars)
str(mtcars)

# Scatter Plot ----
plot(mtcars$mpg, mtcars$hp,
     xlab = "Miles per Gallon",
     ylab = "Horsepower",
     main = "MPG vs Horsepower",
     col = "steelblue",
     pch = 19)
abline(lm(hp ~ mpg, data = mtcars), col = "red", lwd = 2)
`,
    filepath: '',
    isDirty: false,
    cursorPosition: { line: 1, column: 1 }
  },
  applyCodeChange: null,
  setEditorContent: (content) =>
    set((state) => ({
      editor: { ...state.editor, content, isDirty: true }
    })),
  setEditorFilepath: (filepath) =>
    set((state) => ({
      editor: { ...state.editor, filepath }
    })),
  setEditorCursorPosition: (cursorPosition) =>
    set((state) => ({
      editor: { ...state.editor, cursorPosition }
    })),
  setEditorIsDirty: (isDirty) =>
    set((state) => ({
      editor: { ...state.editor, isDirty }
    })),
  setApplyCodeChange: (handler) => set({ applyCodeChange: handler })
});
