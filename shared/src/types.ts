// Execution metadata shared between frontend and backend
export type ExecutionSource = 'selection' | 'cell' | 'whole_document' | 'unknown';
export type ExecutionActor = 'user' | 'ai';
export type CodeBlockKind = 'section' | 'chunk' | 'document' | 'selection';

export interface ExecutionContextPayload {
  source: ExecutionSource;
  document_path?: string | null;
  cell_index?: number | null;
  triggered_at_ms: number;
  actor: ExecutionActor;
}

export interface CodeBlockMetadataPayload {
  id: string;
  index: number;
  kind: CodeBlockKind;
  label?: string | null;
  start_line: number;
  end_line: number;
  code: string;
}

export interface ExecutionRequestPayload {
  code: string;
  context: ExecutionContextPayload;
  blocks: CodeBlockMetadataPayload[];
}

export interface EnvironmentSnapshotPayload {
  r_path: string;
  working_dir: string;
  temp_dir: string;
}

export interface ExecutionEventPayload {
  event_id: string;
  context: ExecutionContextPayload;
  blocks: CodeBlockMetadataPayload[];
  result: ExecutionResultPayload;
  environment: EnvironmentSnapshotPayload;
  created_at_ms: number;
}

export interface ExecutionResultPayload {
  success: boolean;
  output: string;
  error?: string | null;
  plots: PlotInfoPayload[];
  execution_time_ms: number;
}

export interface PlotInfoPayload {
  filename: string;
  base64_data: string;
  index: number;
}

// WebSocket Event Types
export interface ServerToClientEvents {
  'execution-result': (result: ExecutionResult) => void;
  'execution-error': (error: ExecutionError) => void;
  'file-changed': (data: FileChangeData) => void;
  'ai-response': (response: AIResponse) => void;
  'status-update': (status: StatusUpdate) => void;
}

export interface ClientToServerEvents {
  execute: (code: string, callback: (result: ExecutionResult | ExecutionError) => void) => void;
  'watch-file': (filepath: string) => void;
  'unwatch-file': (filepath: string) => void;
  'ai-request': (request: AIRequest, callback: (response: AIResponse) => void) => void;
  'save-file': (data: SaveFileData, callback: (success: boolean) => void) => void;
  'load-file': (filepath: string, callback: (data: FileChangeData | null) => void) => void;
}

// Data Types
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  plots: PlotInfo[];
  timestamp: number;
  duration: number;
  success: boolean;
}

export interface PlotInfo {
  id: string;
  path: string;
  data: string; // base64 encoded image
  timestamp: number;
}

export interface ExecutionError {
  message: string;
  type: 'syntax' | 'runtime' | 'system';
  line?: number;
  timestamp: number;
  success: false;
}

export interface FileChangeData {
  filepath: string;
  content: string;
  timestamp: number;
}

export interface AIRequest {
  code: string;
  prompt: string;
  context?: {
    executionHistory?: ExecutionResult[];
    cursorPosition?: { line: number; column: number };
    lastError?: string;
    selectedText?: string;
  };
}

export interface CodeBlock {
  id: string;
  code: string;
  language: 'r';
  action: 'replace-all' | 'replace-lines' | 'insert-at-cursor';
  targetLines?: {
    start: number;
    end: number;
  };
  explanation?: string;
}

export interface AIResponse {
  message: string;
  suggestedCode?: string; // Deprecated: use codeBlocks instead
  codeBlocks?: CodeBlock[];
  explanation?: string;
  timestamp: number;
}

export interface StatusUpdate {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface SaveFileData {
  filepath: string;
  content: string;
}

// UI State Types
export interface LayoutState {
  editorWidth: number;
  rightPanelWidth: number;
  aiPanelHeight: number;
  consoleHeight: number;
}

export interface EditorState {
  content: string;
  filepath: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
}

export interface ExecutionState {
  isRunning: boolean;
  currentCell?: number;
  results: ExecutionResult[];
  history: ExecutionResult[];
}

export interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  suggestions: string[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string; // Deprecated: use codeBlocks instead
  codeBlocks?: CodeBlock[];
  timestamp: number;
}

export interface AppSettings {
  autoRun: boolean;
  theme: 'light' | 'dark';
  rPath: string;
  fontSize: number;
  // Cell execution features (easy to disable)
  showCellDecorations: boolean;
  highlightExecutingCell: boolean;
}
