/**
 * Unit tests for timeline mock functions.
 *
 * To run these tests, add a test framework (Vitest or Jest):
 *
 * npm install --save-dev vitest @vitest/ui
 *
 * Then add to package.json:
 * "scripts": {
 *   "test": "vitest",
 *   "test:ui": "vitest --ui"
 * }
 *
 * Run with: npm test
 */

// import { describe, test, expect } from 'vitest'; // or '@jest/globals'
import {
  createMockEvent,
  generateMockTimeline,
  mockTimelineQuery,
  generateMockStats,
} from '../timelineMocks';

// Mock test framework types for compilation
declare const describe: any;
declare const test: any;
declare const expect: any;

describe('createMockEvent', () => {
  test('generates valid ExecutionEvent', () => {
    const event = createMockEvent();

    expect(event).toBeDefined();
    expect(event.event_id).toMatch(/^evt-/);
    expect(event.context).toBeDefined();
    expect(event.blocks).toHaveLength(1);
    expect(event.result).toBeDefined();
    expect(event.environment).toBeDefined();
    expect(event.created_at_ms).toBeGreaterThan(0);
  });

  test('applies overrides correctly', () => {
    const event = createMockEvent({
      event_id: 'custom-id',
      context: {
        source: 'selection',
        document_path: 'custom.R',
        cell_index: null,
        triggered_at_ms: 123456789,
        actor: 'ai',
      },
    });

    expect(event.event_id).toBe('custom-id');
    expect(event.context.source).toBe('selection');
    expect(event.context.document_path).toBe('custom.R');
    expect(event.context.actor).toBe('ai');
  });
});

describe('generateMockTimeline', () => {
  test('generates requested number of events', () => {
    const events = generateMockTimeline(10);
    expect(events).toHaveLength(10);
  });

  test('generates 20 events by default', () => {
    const events = generateMockTimeline();
    expect(events).toHaveLength(20);
  });

  test('events are in chronological order', () => {
    const events = generateMockTimeline(50);

    for (let i = 1; i < events.length; i++) {
      expect(events[i].created_at_ms).toBeGreaterThanOrEqual(events[i - 1].created_at_ms);
    }
  });

  test('includes variety of event types', () => {
    const events = generateMockTimeline(100);

    const hasUserEvents = events.some((e) => e.context.actor === 'user');
    const hasAiEvents = events.some((e) => e.context.actor === 'ai');
    const hasPlots = events.some((e) => e.result.plots.length > 0);
    const hasErrors = events.some((e) => e.result.error !== null);

    expect(hasUserEvents).toBe(true);
    expect(hasAiEvents).toBe(true);
    expect(hasPlots).toBe(true);
    expect(hasErrors).toBe(true);
  });
});

describe('mockTimelineQuery', () => {
  const mockEvents = generateMockTimeline(50);

  test('returns all events when no filters applied', () => {
    const result = mockTimelineQuery({}, mockEvents);

    expect(result.events.length).toBeLessThanOrEqual(50);
    expect(result.total).toBe(50);
  });

  test('filters by actor', () => {
    const result = mockTimelineQuery({ filters: { actor: 'user' } }, mockEvents);

    expect(result.events.every((e) => e.context.actor === 'user')).toBe(true);
    expect(result.total).toBeLessThanOrEqual(50);
  });

  test('filters by source', () => {
    const result = mockTimelineQuery({ filters: { source: 'cell' } }, mockEvents);

    expect(result.events.every((e) => e.context.source === 'cell')).toBe(true);
  });

  test('filters by time range', () => {
    const midTime =
      (mockEvents[0].created_at_ms + mockEvents[mockEvents.length - 1].created_at_ms) / 2;

    const result = mockTimelineQuery(
      {
        filters: {
          startTime: midTime,
        },
      },
      mockEvents
    );

    expect(result.events.every((e) => e.created_at_ms >= midTime)).toBe(true);
  });

  test('filters by hasPlots', () => {
    const result = mockTimelineQuery({ filters: { hasPlots: true } }, mockEvents);

    expect(result.events.every((e) => e.result.plots.length > 0)).toBe(true);
  });

  test('filters by hasErrors', () => {
    const result = mockTimelineQuery({ filters: { hasErrors: true } }, mockEvents);

    expect(result.events.every((e) => e.result.error !== null)).toBe(true);
  });

  test('filters by code content', () => {
    const result = mockTimelineQuery({ filters: { codeContains: 'plot' } }, mockEvents);

    expect(
      result.events.every((e) => e.blocks.some((b) => b.code.toLowerCase().includes('plot')))
    ).toBe(true);
  });

  test('sorts descending by default', () => {
    const result = mockTimelineQuery({}, mockEvents);

    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i - 1].created_at_ms).toBeGreaterThanOrEqual(
        result.events[i].created_at_ms
      );
    }
  });

  test('sorts ascending when specified', () => {
    const result = mockTimelineQuery({ sort: 'asc' }, mockEvents);

    for (let i = 1; i < result.events.length; i++) {
      expect(result.events[i].created_at_ms).toBeGreaterThanOrEqual(
        result.events[i - 1].created_at_ms
      );
    }
  });

  test('paginates correctly', () => {
    const page1 = mockTimelineQuery({ limit: 10, offset: 0 }, mockEvents);
    const page2 = mockTimelineQuery({ limit: 10, offset: 10 }, mockEvents);

    expect(page1.events).toHaveLength(10);
    expect(page2.events).toHaveLength(10);
    expect(page1.events[0].event_id).not.toBe(page2.events[0].event_id);
  });

  test('sets hasMore correctly', () => {
    const result1 = mockTimelineQuery({ limit: 10 }, mockEvents);
    expect(result1.hasMore).toBe(true);

    const result2 = mockTimelineQuery({ limit: 50 }, mockEvents);
    expect(result2.hasMore).toBe(false);

    const result3 = mockTimelineQuery({ limit: 100 }, mockEvents);
    expect(result3.hasMore).toBe(false);
  });

  test('respects max limit of 200', () => {
    const largeTimeline = generateMockTimeline(300);
    const result = mockTimelineQuery({ limit: 250 }, largeTimeline);

    expect(result.events.length).toBeLessThanOrEqual(200);
  });

  test('combines multiple filters', () => {
    const result = mockTimelineQuery(
      {
        filters: {
          actor: 'user',
          hasPlots: true,
        },
        sort: 'asc',
        limit: 5,
      },
      mockEvents
    );

    expect(result.events.every((e: any) => e.context.actor === 'user')).toBe(true);
    expect(result.events.every((e: any) => e.result.plots.length > 0)).toBe(true);
    expect(result.events.length).toBeLessThanOrEqual(5);
  });
});

describe('generateMockStats', () => {
  test('calculates stats correctly', () => {
    const events = generateMockTimeline(100);
    const stats = generateMockStats(events);

    expect(stats.totalEvents).toBe(100);
    expect(stats.totalPlots).toBeGreaterThanOrEqual(0);
    expect(stats.totalErrors).toBeGreaterThanOrEqual(0);
    expect(stats.userActions + stats.aiActions).toBe(100);
    expect(stats.sessionDuration).toBeGreaterThan(0);
    expect(stats.sessionEndTime).toBeGreaterThan(stats.sessionStartTime);
  });

  test('handles empty timeline', () => {
    const stats = generateMockStats([]);

    expect(stats.totalEvents).toBe(0);
    expect(stats.totalPlots).toBe(0);
    expect(stats.totalErrors).toBe(0);
    expect(stats.userActions).toBe(0);
    expect(stats.aiActions).toBe(0);
    expect(stats.sessionDuration).toBe(0);
  });

  test('calculates session duration correctly', () => {
    const events = generateMockTimeline(10);
    const stats = generateMockStats(events);

    const actualDuration =
      events[events.length - 1].created_at_ms - events[0].created_at_ms;

    expect(stats.sessionDuration).toBeCloseTo(actualDuration, -2); // Within 100ms
  });
});
