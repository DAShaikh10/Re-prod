import type {
  ExecutionSource as ProtocolExecutionSource,
  ExecutionActor as ProtocolExecutionActor,
  CodeBlockKind as ProtocolCodeBlockKind,
  CodeBlockMetadata as ProtocolCodeBlockMetadata,
  ExecutionContext as ProtocolExecutionContext,
  ExecutionRequest as ProtocolExecutionRequest,
  ExecutionEvent as ProtocolExecutionEvent,
  ExecutionResult as ProtocolExecutionResult,
  PlotInfo as ProtocolPlotInfo,
  EnvironmentSnapshot as ProtocolEnvironmentSnapshot,
  ChatMessage as ProtocolChatMessage,
  FileChangeEvent as ProtocolFileChangeEvent,
  ArtifactInfo as ProtocolArtifactInfo,
  ToolExecutionRequest as ProtocolToolExecutionRequest,
  ToolExecutionResult as ProtocolToolExecutionResult,
} from './protocol-types';

// Protocol aliases to keep existing payload naming conventions in the client.
export type ExecutionSource = ProtocolExecutionSource;
export type ExecutionActor = ProtocolExecutionActor;
export type CodeBlockKind = ProtocolCodeBlockKind;
export type ExecutionContextPayload = ProtocolExecutionContext;
export type CodeBlockMetadataPayload = ProtocolCodeBlockMetadata;
export type ExecutionRequestPayload = ProtocolExecutionRequest;
export type ExecutionEventPayload = ProtocolExecutionEvent;
export type ExecutionResultPayload = ProtocolExecutionResult;
export type PlotInfoPayload = ProtocolPlotInfo;
export type EnvironmentSnapshotPayload = ProtocolEnvironmentSnapshot;
export type ChatMessagePayload = ProtocolChatMessage;
export type FileChangeEventPayload = ProtocolFileChangeEvent;
export type ArtifactInfoPayload = ProtocolArtifactInfo;
export type ToolExecutionRequestPayload = ProtocolToolExecutionRequest;
export type ToolExecutionResultPayload = ProtocolToolExecutionResult;

// UI-facing execution log structures
export interface ExecutionLogPlot {
  id: string;
  path: string;
  data: string; // base64 encoded image
  timestamp: number;
}

export interface ExecutionErrorLog {
  message: string;
  type: 'syntax' | 'runtime' | 'system';
  line?: number;
  timestamp: number;
  success: false;
}

export interface ExecutionLogEntry {
  stdout: string;
  stderr: string;
  plots: ExecutionLogPlot[];
  timestamp: number;
  duration: number;
  success: boolean;
}

export interface FileChangeData {
  filepath: string;
  content: string;
  timestamp: number;
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

export interface AIRequest {
  code: string;
  prompt: string;
  context?: {
    executionHistory?: ExecutionLogEntry[];
    cursorPosition?: { line: number; column: number };
    lastError?: string;
    selectedText?: string;
  };
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
  results: ExecutionLogEntry[];
  history: ExecutionLogEntry[];
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
