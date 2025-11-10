import type { ToolManifest } from './tools';
import type {
  ChatMessagePayload,
  ExecutionRequestPayload,
  ExecutionResultPayload,
  ToolExecutionRequestPayload,
} from './types';
import type { TimelineMessage, TimelineQuery, TimelineResponse, TimelineStats } from './timeline';

type ToolExecutionResponse = {
  tool_id: string;
  capability_id: string;
  success: boolean;
  stdout?: string | null;
  stderr?: string | null;
  execution_time_ms: number;
  error?: string | null;
};

export type ExportMode = 'timeline' | 'document';

export interface ExportRMarkdownRequestPayload {
  mode: ExportMode;
  outputPath: string;
  documentPath?: string;
  includeTimestamps: boolean;
  showActor: boolean;
  embedPlots: boolean;
  includeOutputs: boolean;
  includeErrors: boolean;
  includeSummary: boolean;
}

export interface ExportRMarkdownResponsePayload {
  success: boolean;
  outputPath: string;
  error?: string | null;
}

export type ClientMessage =
  | { type: 'execute'; request: ExecutionRequestPayload }
  | { type: 'ai_message'; messages: ChatMessagePayload[]; enable_tools?: boolean }
  | { type: 'list_tools' }
  | ({ type: 'execute_tool' } & ToolExecutionRequestPayload)
  | { type: 'timeline_query'; query: TimelineQuery }
  | { type: 'timeline_stats_query' }
  | {
      type: 'export_rmarkdown';
      request: ExportRMarkdownRequestPayload;
    };

type TimelineEventPush = Extract<TimelineMessage, { type: 'timeline_event_added' }>;

export type ServerMessage =
  | { type: 'execution_result'; result: ExecutionResultPayload }
  | { type: 'ai_response'; response: string }
  | { type: 'ai_response_with_tools'; response: { content: string; tool_calls?: Array<{ name: string; input: Record<string, any> }> } }
  | { type: 'error'; message: string }
  | { type: 'tools'; tools: ToolManifest[] }
  | ({ type: 'tool_execution_result' } & ToolExecutionResponse)
  | { type: 'timeline_response'; data: TimelineResponse }
  | { type: 'timeline_stats_response'; stats: TimelineStats }
  | { type: 'export_rmarkdown_response'; response: ExportRMarkdownResponsePayload }
  | TimelineEventPush;

export type ServerMessageType = ServerMessage['type'];

export type ExtractServerMessage<TType extends ServerMessageType> = Extract<
  ServerMessage,
  { type: TType }
>;
