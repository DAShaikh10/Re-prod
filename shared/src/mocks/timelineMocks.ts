/**
 * Mock data generators for timeline development and testing.
 * Used by Issue 008 (frontend) for UI development without backend dependency.
 */

import type {
  ExecutionEventPayload,
  ExecutionSource,
  ExecutionActor,
  CodeBlockKind,
  PlotInfoPayload,
  TimelineQuery,
  TimelineResponse,
  TimelineStats,
} from '../timeline';

/**
 * Generate mock ExecutionEvent for testing.
 */
export function createMockEvent(
  overrides?: Partial<ExecutionEventPayload>
): ExecutionEventPayload {
  const now = Date.now();
  const randomTime = now - Math.random() * 3600000; // Random time in last hour

  const baseEvent: ExecutionEventPayload = {
    event_id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    context: {
      source: 'cell' as ExecutionSource,
      document_path: 'analysis.R',
      cell_index: 1,
      triggered_at_ms: randomTime,
      actor: 'user' as ExecutionActor,
    },
    blocks: [
      {
        id: `block-${Math.random().toString(36).substr(2, 9)}`,
        index: 0,
        kind: 'section' as CodeBlockKind,
        label: 'Data Analysis',
        start_line: 1,
        end_line: 5,
        code: '# Data Analysis ----\ndata <- read.csv("input.csv")\nsummary(data)',
      },
    ],
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
    created_at_ms: randomTime + Math.random() * 1000,
  };

  return { ...baseEvent, ...overrides };
}

/**
 * Generate a realistic timeline with multiple event types.
 */
export function generateMockTimeline(count: number = 20): ExecutionEventPayload[] {
  const events: ExecutionEventPayload[] = [];
  const startTime = Date.now() - 7200000; // 2 hours ago

  const sources: ExecutionSource[] = ['selection', 'cell', 'whole_document'];
  const documents = ['analysis.R', 'plots.R', 'models.R'];
  const kinds: CodeBlockKind[] = ['section', 'chunk', 'selection'];
  const labels = ['Data Loading', 'Analysis', 'Visualization', 'Export'];
  const codes = [
    '# Load data\ndata <- read.csv("sequences.fasta")',
    'tree <- nj(dist.dna(sequences))',
    'plot(tree, type="phylogram")',
    'ggsave("output.png", width=8, height=6)',
  ];

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + (i * (7200000 / count));
    const hasPlot = Math.random() > 0.7;
    const hasError = Math.random() > 0.85;
    const isAI = Math.random() > 0.6;

    const plots: PlotInfoPayload[] = hasPlot
      ? [
          {
            filename: `plot_${i}.png`,
            base64_data:
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            index: i,
          },
        ]
      : [];

    events.push(
      createMockEvent({
        event_id: `evt-mock-${i}`,
        context: {
          source: sources[i % sources.length],
          document_path: documents[i % documents.length],
          cell_index: i % 3,
          triggered_at_ms: timestamp,
          actor: isAI ? 'ai' : 'user',
        },
        blocks: [
          {
            id: `block-${i}`,
            index: 0,
            kind: kinds[i % kinds.length],
            label: labels[i % labels.length],
            start_line: i * 5 + 1,
            end_line: i * 5 + 5,
            code: codes[i % codes.length],
          },
        ],
        result: {
          success: !hasError,
          output: hasError ? '' : `[${i}] "Success"`,
          error: hasError ? `Error: unexpected symbol at line ${i}` : null,
          plots,
          execution_time_ms: Math.floor(Math.random() * 2000),
        },
        created_at_ms: timestamp + Math.random() * 1000,
      })
    );
  }

  return events;
}

/**
 * Mock timeline query implementation for UI development.
 */
export function mockTimelineQuery(
  query: TimelineQuery,
  allEvents: ExecutionEventPayload[]
): TimelineResponse {
  let filtered = [...allEvents];

  // Apply filters
  if (query.filters?.actor) {
    filtered = filtered.filter((e) => e.context.actor === query.filters!.actor);
  }
  if (query.filters?.source) {
    filtered = filtered.filter((e) => e.context.source === query.filters!.source);
  }
  if (query.filters?.startTime) {
    filtered = filtered.filter((e) => e.created_at_ms >= query.filters!.startTime!);
  }
  if (query.filters?.endTime) {
    filtered = filtered.filter((e) => e.created_at_ms <= query.filters!.endTime!);
  }
  if (query.filters?.hasPlots) {
    filtered = filtered.filter((e) => e.result.plots.length > 0);
  }
  if (query.filters?.hasErrors) {
    filtered = filtered.filter((e) => e.result.error !== null && e.result.error !== undefined);
  }
  if (query.filters?.codeContains) {
    const searchTerm = query.filters.codeContains.toLowerCase();
    filtered = filtered.filter((e) =>
      e.blocks.some((b) => b.code.toLowerCase().includes(searchTerm))
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    const diff = a.created_at_ms - b.created_at_ms;
    return query.sort === 'asc' ? diff : -diff;
  });

  // Apply pagination
  const limit = Math.min(query.limit ?? 50, 200); // Max 200
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
export function generateMockStats(events: ExecutionEventPayload[]): TimelineStats {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      totalPlots: 0,
      totalErrors: 0,
      userActions: 0,
      aiActions: 0,
      sessionStartTime: Date.now(),
      sessionEndTime: Date.now(),
      sessionDuration: 0,
    };
  }

  const timestamps = events.map((e) => e.created_at_ms);

  return {
    totalEvents: events.length,
    totalPlots: events.reduce((sum, e) => sum + e.result.plots.length, 0),
    totalErrors: events.filter((e) => e.result.error !== null && e.result.error !== undefined)
      .length,
    userActions: events.filter((e) => e.context.actor === 'user').length,
    aiActions: events.filter((e) => e.context.actor === 'ai').length,
    sessionStartTime: Math.min(...timestamps),
    sessionEndTime: Math.max(...timestamps),
    sessionDuration: Math.max(...timestamps) - Math.min(...timestamps),
  };
}
