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

export type ClientMessage =
  | { type: 'execute'; request: ExecutionRequestPayload }
  | { type: 'ai_message'; messages: ChatMessagePayload[] }
  | { type: 'list_tools' }
  | ({ type: 'execute_tool' } & ToolExecutionRequestPayload)
  | { type: 'timeline_query'; query: TimelineQuery }
  | { type: 'timeline_stats_query' };

type TimelineEventPush = Extract<TimelineMessage, { type: 'timeline_event_added' }>;

export type ServerMessage =
  | { type: 'execution_result'; result: ExecutionResultPayload }
  | { type: 'ai_response'; response: string }
  | { type: 'error'; message: string }
  | { type: 'tools'; tools: ToolManifest[] }
  | ({ type: 'tool_execution_result' } & ToolExecutionResponse)
  | { type: 'timeline_response'; data: TimelineResponse }
  | { type: 'timeline_stats_response'; stats: TimelineStats }
  | TimelineEventPush;

export type ServerMessageType = ServerMessage['type'];

export type ExtractServerMessage<TType extends ServerMessageType> = Extract<
  ServerMessage,
  { type: TType }
>;
