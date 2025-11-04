/**
 * Timeline query service for fetching execution events.
 * Phase 1: Uses mock data for development
 * Phase 2: Will use WebSocket for real backend integration
 */

import {
  type TimelineQuery,
  type TimelineResponse,
  type TimelineStats,
  type ExecutionEventPayload,
  generateMockTimeline,
  mockTimelineQuery,
  generateMockStats,
} from 'shared';

// Generate mock events for development
// TODO: Remove this when backend is ready (Issue 007)
const mockEvents: ExecutionEventPayload[] = generateMockTimeline(100);

/**
 * Query timeline with filters, sorting, and pagination.
 * Currently uses mock data. Will be replaced with WebSocket in Phase 2.
 */
export async function queryTimeline(query: TimelineQuery): Promise<TimelineResponse> {
  // Simulate network delay for realistic testing
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Phase 1: Use mock data
  return mockTimelineQuery(query, mockEvents);

  // Phase 2: Use real WebSocket (after Issue 007 is complete)
  // return socketService.send({ type: 'timeline_query', query });
}

/**
 * Get timeline statistics.
 * Currently uses mock data. Will be replaced with WebSocket in Phase 2.
 */
export async function getTimelineStats(): Promise<TimelineStats> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Phase 1: Use mock data
  return generateMockStats(mockEvents);

  // Phase 2: Use real WebSocket (after Issue 007 is complete)
  // return socketService.send({ type: 'timeline_stats_query' });
}

/**
 * Add a new event to the timeline in real-time.
 * This will be used when backend sends 'timeline_event_added' messages.
 */
export function subscribeToTimelineEvents(
  _callback: (event: ExecutionEventPayload) => void
): () => void {
  // Phase 2: Subscribe to WebSocket events
  // socketService.on('timeline_event_added', _callback);
  // return () => socketService.off('timeline_event_added', _callback);

  // Phase 1: No real-time updates yet
  return () => {};
}
