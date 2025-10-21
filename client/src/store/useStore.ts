import { create } from 'zustand';
import type {
  EditorState,
  ExecutionState,
  AIState,
  AppSettings,
  ExecutionResult,
  AIMessage,
  CodeBlock
} from '../../../shared/src/types';

interface AppState {
  editor: EditorState;
  execution: ExecutionState;
  ai: AIState;
  settings: AppSettings;
  isConnected: boolean;

  setEditorContent: (content: string) => void;
  setFilepath: (filepath: string) => void;
  setIsDirty: (isDirty: boolean) => void;
  setCursorPosition: (position: { line: number; column: number }) => void;

  setIsRunning: (isRunning: boolean) => void;
  addExecutionResult: (result: ExecutionResult) => void;
  clearResults: () => void;

  addAIMessage: (message: AIMessage) => void;
  setAILoading: (isLoading: boolean) => void;
  clearAIMessages: () => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  setConnected: (connected: boolean) => void;

  // AI Code Application
  applyCodeChange: ((codeBlock: CodeBlock) => void) | null;
  setApplyCodeChange: (fn: (codeBlock: CodeBlock) => void) => void;
}

export const useStore = create<AppState>((set) => ({
  editor: {
    content: `# Welcome to Re-Prod ----
# AI-Powered R Analysis IDE
# Try Cmd/Ctrl+Enter to run current section
# Try Shift+Enter to run and move to next section

# Load Data ----
# Load the built-in mtcars dataset
data(mtcars)
head(mtcars)

# Summary Statistics ----
# Get basic statistics for the dataset
summary(mtcars)

# Check structure
str(mtcars)

# Scatter Plot ----
# Visualize relationship between MPG and Horsepower
plot(mtcars$mpg, mtcars$hp,
     xlab = "Miles per Gallon",
     ylab = "Horsepower",
     main = "MPG vs Horsepower",
     col = "steelblue",
     pch = 19)

# Add a trend line
abline(lm(hp ~ mpg, data = mtcars), col = "red", lwd = 2)
`,
    filepath: '',
    isDirty: false,
    cursorPosition: { line: 1, column: 1 }
  },

  execution: {
    isRunning: false,
    results: [],
    history: []
  },

  ai: {
    messages: [],
    isLoading: false,
    suggestions: []
  },

  settings: {
    autoRun: false,
    theme: 'light',
    rPath: 'Rscript',
    fontSize: 13,
    showCellDecorations: true,      // Easy to disable
    highlightExecutingCell: true    // Easy to disable
  },

  isConnected: false,

  setEditorContent: (content) =>
    set((state) => ({
      editor: { ...state.editor, content, isDirty: true }
    })),

  setFilepath: (filepath) =>
    set((state) => ({
      editor: { ...state.editor, filepath, isDirty: false }
    })),

  setIsDirty: (isDirty) =>
    set((state) => ({
      editor: { ...state.editor, isDirty }
    })),

  setCursorPosition: (cursorPosition) =>
    set((state) => ({
      editor: { ...state.editor, cursorPosition }
    })),

  setIsRunning: (isRunning) =>
    set((state) => ({
      execution: { ...state.execution, isRunning }
    })),

  addExecutionResult: (result) =>
    set((state) => ({
      execution: {
        ...state.execution,
        results: [...state.execution.results, result],
        history: [...state.execution.history, result],
        isRunning: false
      }
    })),

  clearResults: () =>
    set((state) => ({
      execution: { ...state.execution, results: [] }
    })),

  addAIMessage: (message) =>
    set((state) => ({
      ai: {
        ...state.ai,
        messages: [...state.ai.messages, message]
      }
    })),

  setAILoading: (isLoading) =>
    set((state) => ({
      ai: { ...state.ai, isLoading }
    })),

  clearAIMessages: () =>
    set((state) => ({
      ai: { ...state.ai, messages: [] }
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    })),

  setConnected: (connected) => set({ isConnected: connected }),

  // AI Code Application
  applyCodeChange: null,
  setApplyCodeChange: (fn) => set({ applyCodeChange: fn })
}));
