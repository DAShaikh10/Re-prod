# 019 – Timeline API Contract & Mock Data

## Priority
P0 – Demo critical (Prerequisite for Issues 007 and 008)

## Summary
Define the API contract (types, query interface, WebSocket messages) and create mock data to enable parallel development of Issue 007 (backend storage) and Issue 008 (frontend UI) without dependencies.

## Rationale
- **Enable parallel development**: Backend and frontend teams can work independently with a clear contract
- **Reduce integration risk**: Agreed-upon interfaces minimize last-minute breaking changes
- **Accelerate development**: UI team can start with mock data immediately
- **Enforce type safety**: Shared TypeScript types ensure backend/frontend alignment

Without this foundation, Issues 007 and 008 would need to be sequential, delaying demo readiness by 2-3 days.

## Deliverables

### 1. Shared Type Definitions (`shared/src/timeline.ts`)

Define all timeline-related types in the shared package:

```typescript
// Re-export ExecutionEvent from existing shared types
export { ExecutionEvent, ExecutionContext, ExecutionSource, ExecutionActor, CodeBlockMetadata } from './types';

/**
 * Query parameters for fetching timeline events.
 * Used by UI to request filtered/sorted/paginated events from backend.
 */
export interface TimelineQuery {
  filters?: {
    /** Filter by actor (user or AI) */
    actor?: 'user' | 'ai';

    /** Filter by execution source */
    source?: 'selection' | 'cell' | 'whole_document';

    /** Filter by time range (epoch milliseconds) */
    startTime?: number;
    endTime?: number;

    /** Only events with plots */
    hasPlots?: boolean;

    /** Only events with errors */
    hasErrors?: boolean;

    /** Text search in code blocks */
    codeContains?: string;
  };

  /** Sort order (default: desc, newest first) */
  sort?: 'asc' | 'desc';

  /** Pagination limit (default: 50, max: 200) */
  limit?: number;

  /** Pagination offset (default: 0) */
  offset?: number;
}

/**
 * Response containing timeline events with pagination metadata.
 */
export interface TimelineResponse {
  /** Array of execution events matching the query */
  events: ExecutionEvent[];

  /** Total number of events matching filters (ignoring pagination) */
  total: number;

  /** Whether more events exist beyond current page */
  hasMore: boolean;

  /** Query that produced this response (for debugging) */
  query: TimelineQuery;
}

/**
 * Statistics about the timeline for UI summary display.
 */
export interface TimelineStats {
  totalEvents: number;
  totalPlots: number;
  totalErrors: number;
  userActions: number;
  aiActions: number;
  sessionStartTime: number;  // epoch ms
  sessionEndTime: number;    // epoch ms
  sessionDuration: number;   // milliseconds
}
```

### 2. WebSocket API Messages

Define WebSocket message types for real-time timeline updates:

```typescript
// Add to shared/src/types.ts or create shared/src/websocket.ts

/**
 * Client → Server: Request timeline events
 */
export interface TimelineQueryMessage {
  type: 'timeline_query';
  query: TimelineQuery;
}

/**
 * Server → Client: Timeline query response
 */
export interface TimelineResponseMessage {
  type: 'timeline_response';
  data: TimelineResponse;
}

/**
 * Server → Client: New event added to timeline (real-time push)
 */
export interface TimelineEventAddedMessage {
  type: 'timeline_event_added';
  event: ExecutionEvent;
}

/**
 * Client → Server: Request timeline statistics
 */
export interface TimelineStatsQueryMessage {
  type: 'timeline_stats_query';
}

/**
 * Server → Client: Timeline statistics response
 */
export interface TimelineStatsResponseMessage {
  type: 'timeline_stats_response';
  stats: TimelineStats;
}
```

### 3. HTTP API Endpoints (Optional Alternative)

If WebSocket is not used for queries, define HTTP endpoints:

```
GET /api/timeline/events
  Query params: actor, source, startTime, endTime, hasPlots, hasErrors, codeContains, sort, limit, offset
  Response: TimelineResponse

GET /api/timeline/stats
  Response: TimelineStats

POST /api/timeline/clear
  Clear all timeline events (dev/test only)
  Response: { success: boolean, clearedCount: number }
```

### 4. Mock Data Generator

Create realistic mock data for UI development:

```typescript
// shared/src/mocks/timelineMocks.ts

import { ExecutionEvent, ExecutionContext, ExecutionSource, ExecutionActor, CodeBlockKind, CodeBlockMetadata, ExecutionResult, EnvironmentSnapshot, PlotInfo } from '../types';

/**
 * Generate mock ExecutionEvent for testing.
 */
export function createMockEvent(overrides?: Partial<ExecutionEvent>): ExecutionEvent {
  const baseEvent: ExecutionEvent = {
    event_id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    context: {
      source: ExecutionSource.Cell,
      document_path: 'analysis.R',
      cell_index: 1,
      triggered_at_ms: Date.now() - Math.random() * 3600000, // Random time in last hour
      actor: ExecutionActor.User,
    },
    blocks: [{
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      index: 0,
      kind: CodeBlockKind.Section,
      label: 'Data Analysis',
      start_line: 1,
      end_line: 5,
      code: '# Data Analysis ----\ndata <- read.csv("input.csv")\nsummary(data)',
    }],
    result: {
      success: true,
      output: '[1] 42\n',
      error: null,
      plots: [],
      execution_time_ms: Math.floor(Math.random() * 1000),
    },
    environment: {
      r_path: 'Rscript',
      working_dir: '/Users/test/project',
      temp_dir: '/tmp/reprod',
    },
    created_at_ms: Date.now(),
  };

  return { ...baseEvent, ...overrides };
}

/**
 * Generate a realistic timeline with multiple event types.
 */
export function generateMockTimeline(count: number = 20): ExecutionEvent[] {
  const events: ExecutionEvent[] = [];
  const startTime = Date.now() - 7200000; // 2 hours ago

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + (i * (7200000 / count));
    const hasPlot = Math.random() > 0.7;
    const hasError = Math.random() > 0.85;
    const isAI = Math.random() > 0.6;

    events.push(createMockEvent({
      event_id: `evt-mock-${i}`,
      context: {
        source: ['selection', 'cell', 'whole_document'][i % 3] as any,
        document_path: ['analysis.R', 'plots.R', 'models.R'][i % 3],
        cell_index: i % 3,
        triggered_at_ms: timestamp,
        actor: isAI ? ExecutionActor.Ai : ExecutionActor.User,
      },
      blocks: [{
        id: `block-${i}`,
        index: 0,
        kind: ['section', 'chunk', 'selection'][i % 3] as any,
        label: ['Data Loading', 'Analysis', 'Visualization', 'Export'][i % 4],
        start_line: i * 5 + 1,
        end_line: i * 5 + 5,
        code: [
          '# Load data\ndata <- read.csv("sequences.fasta")',
          'tree <- nj(dist.dna(sequences))',
          'plot(tree, type="phylogram")',
          'ggsave("output.png", width=8, height=6)',
        ][i % 4],
      }],
      result: {
        success: !hasError,
        output: hasError ? '' : `[${i}] "Success"`,
        error: hasError ? `Error: unexpected symbol at line ${i}` : null,
        plots: hasPlot ? [{
          filename: `plot_${i}.png`,
          base64_data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          index: i,
        }] : [],
        execution_time_ms: Math.floor(Math.random() * 2000),
      },
      created_at_ms: timestamp + Math.random() * 1000,
    }));
  }

  return events;
}

/**
 * Mock timeline query implementation for UI development.
 */
export function mockTimelineQuery(query: TimelineQuery, allEvents: ExecutionEvent[]): TimelineResponse {
  let filtered = [...allEvents];

  // Apply filters
  if (query.filters?.actor) {
    filtered = filtered.filter(e => e.context.actor === query.filters!.actor);
  }
  if (query.filters?.source) {
    filtered = filtered.filter(e => e.context.source === query.filters!.source);
  }
  if (query.filters?.startTime) {
    filtered = filtered.filter(e => e.created_at_ms >= query.filters!.startTime!);
  }
  if (query.filters?.endTime) {
    filtered = filtered.filter(e => e.created_at_ms <= query.filters!.endTime!);
  }
  if (query.filters?.hasPlots) {
    filtered = filtered.filter(e => e.result.plots.length > 0);
  }
  if (query.filters?.hasErrors) {
    filtered = filtered.filter(e => e.result.error !== null);
  }
  if (query.filters?.codeContains) {
    const searchTerm = query.filters.codeContains.toLowerCase();
    filtered = filtered.filter(e =>
      e.blocks.some(b => b.code.toLowerCase().includes(searchTerm))
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const diff = a.created_at_ms - b.created_at_ms;
    return query.sort === 'asc' ? diff : -diff;
  });

  // Apply pagination
  const limit = query.limit ?? 50;
  const offset = query.offset ?? 0;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    events: paginated,
    total: filtered.length,
    hasMore: offset + limit < filtered.length,
    query,
  };
}

/**
 * Generate mock timeline statistics.
 */
export function generateMockStats(events: ExecutionEvent[]): TimelineStats {
  return {
    totalEvents: events.length,
    totalPlots: events.reduce((sum, e) => sum + e.result.plots.length, 0),
    totalErrors: events.filter(e => e.result.error !== null).length,
    userActions: events.filter(e => e.context.actor === ExecutionActor.User).length,
    aiActions: events.filter(e => e.context.actor === ExecutionActor.Ai).length,
    sessionStartTime: Math.min(...events.map(e => e.created_at_ms)),
    sessionEndTime: Math.max(...events.map(e => e.created_at_ms)),
    sessionDuration: Math.max(...events.map(e => e.created_at_ms)) - Math.min(...events.map(e => e.created_at_ms)),
  };
}
```

### 5. API Contract Documentation

Create `docs/.obsidian/api/timeline-api-contract.md`:

```markdown
# Timeline API Contract

## Overview
This document defines the contract between frontend (Issue 008) and backend (Issue 007) for timeline functionality.

## Data Flow

1. **Backend**: Implements `TimelineSink` to store `ExecutionEvent`s
2. **Backend**: Provides query API (WebSocket or HTTP)
3. **Frontend**: Queries timeline with filters/pagination
4. **Backend**: Returns `TimelineResponse` with events
5. **Frontend**: Renders timeline UI

## Type Definitions
See `shared/src/timeline.ts` for all types.

## WebSocket Messages

### Client → Server

#### Query Timeline
\`\`\`json
{
  "type": "timeline_query",
  "query": {
    "filters": {
      "actor": "user",
      "hasPlots": true
    },
    "sort": "desc",
    "limit": 20
  }
}
\`\`\`

#### Request Stats
\`\`\`json
{
  "type": "timeline_stats_query"
}
\`\`\`

### Server → Client

#### Timeline Response
\`\`\`json
{
  "type": "timeline_response",
  "data": {
    "events": [...],
    "total": 150,
    "hasMore": true,
    "query": {...}
  }
}
\`\`\`

#### Real-time Event
\`\`\`json
{
  "type": "timeline_event_added",
  "event": {...}
}
\`\`\`

#### Stats Response
\`\`\`json
{
  "type": "timeline_stats_response",
  "stats": {
    "totalEvents": 150,
    "totalPlots": 45,
    ...
  }
}
\`\`\`

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| filters.actor | "user" \| "ai" | No | - | Filter by who triggered execution |
| filters.source | string | No | - | Filter by execution source |
| filters.startTime | number | No | - | Filter by time range (epoch ms) |
| filters.endTime | number | No | - | Filter by time range (epoch ms) |
| filters.hasPlots | boolean | No | - | Only events with plots |
| filters.hasErrors | boolean | No | - | Only events with errors |
| filters.codeContains | string | No | - | Text search in code blocks |
| sort | "asc" \| "desc" | No | "desc" | Sort order |
| limit | number | No | 50 | Max 200 |
| offset | number | No | 0 | Pagination offset |

## Error Handling

### Backend Errors
\`\`\`json
{
  "type": "error",
  "message": "Timeline query failed: database connection error"
}
\`\`\`

### Frontend Fallback
- Show loading spinner during query
- Display error message if query fails
- Retry with exponential backoff
- Fall back to cached/mock data if available

## Performance Requirements

- Query response time: < 200ms for 1000 events
- Real-time event delivery: < 50ms latency
- UI rendering: 60fps with 100+ visible events

## Testing Strategy

### Backend (Issue 007)
- Unit tests for query filtering/sorting
- Integration tests with SQLite
- Load tests with 10,000+ events

### Frontend (Issue 008)
- Component tests with mock data
- Integration tests with mock WebSocket
- E2E tests with real backend (after integration)

## Migration Path

1. **Phase 1** (This issue): Define types, create mocks
2. **Phase 2** (Issue 007): Implement backend storage + API
3. **Phase 3** (Issue 008): Implement frontend UI with mocks
4. **Phase 4** (Integration): Connect frontend to backend, remove mocks
5. **Phase 5** (Polish): Add real-time updates, optimize queries

## Success Criteria

✅ All types defined in `shared/src/timeline.ts`
✅ Mock data generator produces realistic events
✅ Mock query function filters/sorts correctly
✅ API contract documented
✅ Both Issue 007 and 008 teams can start work immediately
\`\`\`

## Demo Dependencies
- **Depends on**: Issue 005 (ExecutionEvent schema already exists)
- **Enables**: Issues 007, 008 (parallel development without blocking)

## Acceptance Criteria

1. ✅ `shared/src/timeline.ts` created with all type definitions
2. ✅ `shared/src/mocks/timelineMocks.ts` created with mock generators
3. ✅ Mock data generator produces 20+ realistic events
4. ✅ Mock query function correctly filters by actor, source, time, plots, errors
5. ✅ Mock query function correctly sorts asc/desc
6. ✅ Mock query function correctly paginates with limit/offset
7. ✅ WebSocket message types defined
8. ✅ API contract documented in `docs/.obsidian/api/timeline-api-contract.md`
9. ✅ Unit tests for mock query function pass
10. ✅ Issue 007 team confirms they can start implementation
11. ✅ Issue 008 team confirms they can start implementation

## Implementation Notes

### Estimated Time
- **2-4 hours** for one developer
- Can be completed in a single session

### Files to Create/Modify
```
shared/src/timeline.ts          (NEW)
shared/src/mocks/timelineMocks.ts (NEW)
shared/src/index.ts             (UPDATE: export timeline types)
docs/.obsidian/api/timeline-api-contract.md (NEW)
```

### Testing Approach
```typescript
// shared/src/mocks/__tests__/timelineMocks.test.ts

describe('mockTimelineQuery', () => {
  const mockEvents = generateMockTimeline(50);

  test('filters by actor', () => {
    const result = mockTimelineQuery({ filters: { actor: 'user' } }, mockEvents);
    expect(result.events.every(e => e.context.actor === 'user')).toBe(true);
  });

  test('sorts descending by default', () => {
    const result = mockTimelineQuery({}, mockEvents);
    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i-1].created_at_ms).toBeGreaterThanOrEqual(result.events[i].created_at_ms);
    }
  });

  test('paginates correctly', () => {
    const page1 = mockTimelineQuery({ limit: 10, offset: 0 }, mockEvents);
    const page2 = mockTimelineQuery({ limit: 10, offset: 10 }, mockEvents);
    expect(page1.events.length).toBe(10);
    expect(page2.events.length).toBe(10);
    expect(page1.events[0].event_id).not.toBe(page2.events[0].event_id);
    expect(page1.hasMore).toBe(true);
  });
});
```

## Coordination Notes

This issue should be completed **before** starting Issues 007 and 008.

**Recommended workflow:**
1. Assign this issue to one developer (2-4 hours)
2. Review types with both Issue 007 and 008 teams
3. Merge to `develop`
4. Create worktrees for Issue 007 and 008 from latest `develop`
5. Both teams can then work in parallel

## References
- Issue 005: R execution capture (provides ExecutionEvent schema)
- Issue 007: Session timeline data model (will implement backend)
- Issue 008: Session timeline UI (will implement frontend)
- `core/src/protocol.rs`: Existing ExecutionEvent definition
