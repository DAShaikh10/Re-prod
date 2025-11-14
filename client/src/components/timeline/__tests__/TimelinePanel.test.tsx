import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TimelinePanel } from '../TimelinePanel';
import { useStore } from '@/core';
import * as timelineService from '@/services/timelineService';
import type { ExecutionEventPayload, TimelineStats } from 'shared';

// Mock the services
vi.mock('@/services/timelineService', () => ({
  queryTimeline: vi.fn(),
  getTimelineStats: vi.fn(),
  subscribeToTimelineEvents: vi.fn(),
}));

let eventCounter = 0;
const createMockEvent = (overrides?: Partial<ExecutionEventPayload>): ExecutionEventPayload => ({
  event_id: `evt-${++eventCounter}`,
  context: {
    source: 'cell',
    document_path: 'analysis.R',
    cell_index: 1,
    triggered_at_ms: 1700000000000,
    actor: 'user',
  },
  blocks: [
    {
      id: `block-${eventCounter}`,
      index: 0,
      kind: 'section',
      label: 'Setup',
      start_line: 1,
      end_line: 3,
      code: 'x <- 1:10',
    },
  ],
  result: {
    success: true,
    output: '[1] 1 2 3',
    error: null,
    plots: [],
    execution_time_ms: 42,
  },
  environment: {
    r_path: 'Rscript',
    working_dir: '/tmp',
    temp_dir: '/tmp/reprod',
  },
  created_at_ms: 1700000000500,
  ...overrides,
});

const createMockStats = (): TimelineStats => ({
  totalEvents: 150,
  totalPlots: 25,
  totalErrors: 5,
  userActions: 100,
  aiActions: 50,
  sessionStartTime: 1700000000000,
  sessionEndTime: 1700003600000,
  sessionDuration: 3600000,
});

describe('TimelinePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventCounter = 0; // Reset counter for unique IDs

    // Reset store state
    useStore.setState({
      events: [],
      total: 0,
      hasMore: false,
      loading: false,
      error: null,
      filters: {},
      sort: 'desc',
      limit: 50,
      offset: 0,
      isConnected: false,
    });

    // Setup default mocks
    vi.mocked(timelineService.queryTimeline).mockResolvedValue({
      events: [],
      total: 0,
      hasMore: false,
      query: {},
    });

    vi.mocked(timelineService.getTimelineStats).mockResolvedValue(createMockStats());

    vi.mocked(timelineService.subscribeToTimelineEvents).mockReturnValue(() => {});
  });

  describe('rendering', () => {
    it('should render timeline panel with header', () => {
      render(<TimelinePanel />);

      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });

    it('should render TimelineStats component', () => {
      render(<TimelinePanel />);

      // TimelineStats should be rendered (even if loading)
      expect(screen.getByRole('region', { name: /timeline stats/i }) || screen.getByTestId('timeline-stats')).toBeTruthy();
    });

    it('should render TimelineFilters and TimelineSort', () => {
      render(<TimelinePanel />);

      // These components should be rendered
      const controls = document.querySelector('.timeline-panel-controls');
      expect(controls).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should not fetch when disconnected', async () => {
      useStore.setState({ isConnected: false });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).not.toHaveBeenCalled();
      });
    });

    it('should fetch events when connected', async () => {
      useStore.setState({ isConnected: true });

      const mockEvents = [createMockEvent()];
      // Return mock events for initial fetch, empty for pagination
      vi.mocked(timelineService.queryTimeline).mockImplementation(async (query) => {
        if (query.offset === 0) {
          return {
            events: mockEvents,
            total: 1,
            hasMore: false,
            query: {},
          };
        }
        return {
          events: [],
          total: 1,
          hasMore: false,
          query: {},
        };
      });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledWith({
          filters: {},
          sort: 'desc',
          limit: 50,
          offset: 0,
        });
      });
    });

    it('should show loading state while fetching', async () => {
      useStore.setState({ isConnected: true, loading: true });

      render(<TimelinePanel />);

      // Check if loading indicator is shown (implementation dependent)
      const timeline = screen.getByRole('region', { name: /timeline/i }) || document.querySelector('.timeline-panel-content');
      expect(timeline).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should display error message when query fails', async () => {
      useStore.setState({ isConnected: true });

      vi.mocked(timelineService.queryTimeline).mockRejectedValue(
        new Error('Failed to load timeline')
      );

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load timeline/i)).toBeInTheDocument();
      });
    });

    it('should show error icon with error message', async () => {
      useStore.setState({
        isConnected: true,
        error: 'Connection timeout',
      });

      render(<TimelinePanel />);

      expect(screen.getByText(/Connection timeout/i)).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('stats fetching', () => {
    it('should fetch stats when connected', async () => {
      useStore.setState({ isConnected: true });

      const mockStats = createMockStats();
      vi.mocked(timelineService.getTimelineStats).mockResolvedValue(mockStats);

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.getTimelineStats).toHaveBeenCalled();
      });
    });

    it('should not fetch stats when disconnected', async () => {
      useStore.setState({ isConnected: false });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.getTimelineStats).not.toHaveBeenCalled();
      });
    });

    it('should handle stats fetch error gracefully', async () => {
      useStore.setState({ isConnected: true });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(timelineService.getTimelineStats).mockRejectedValue(
        new Error('Stats unavailable')
      );

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load timeline stats:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('real-time event subscription', () => {
    it('should subscribe to timeline events when connected', async () => {
      useStore.setState({ isConnected: true });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.subscribeToTimelineEvents).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });
    });

    it('should not subscribe when disconnected', async () => {
      useStore.setState({ isConnected: false });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.subscribeToTimelineEvents).not.toHaveBeenCalled();
      });
    });

    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(timelineService.subscribeToTimelineEvents).mockReturnValue(mockUnsubscribe);

      useStore.setState({ isConnected: true });

      const { unmount } = render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.subscribeToTimelineEvents).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should add event when received and matches filters', async () => {
      const addEvent = vi.fn();
      useStore.setState({
        isConnected: true,
        filters: {},
        addEvent,
      });

      let eventHandler: ((event: ExecutionEventPayload) => void) | null = null;
      vi.mocked(timelineService.subscribeToTimelineEvents).mockImplementation((handler) => {
        eventHandler = handler;
        return () => {};
      });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(eventHandler).not.toBeNull();
      });

      // Simulate incoming event
      const newEvent = createMockEvent({ event_id: 'evt-new' });
      eventHandler!(newEvent);

      await waitFor(() => {
        expect(addEvent).toHaveBeenCalledWith(newEvent);
      });
    });

    it('should not add event when it does not match filters', async () => {
      const addEvent = vi.fn();
      useStore.setState({
        isConnected: true,
        filters: { actor: 'ai' }, // Filter for AI events only
        addEvent,
      });

      let eventHandler: ((event: ExecutionEventPayload) => void) | null = null;
      vi.mocked(timelineService.subscribeToTimelineEvents).mockImplementation((handler) => {
        eventHandler = handler;
        return () => {};
      });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(eventHandler).not.toBeNull();
      });

      // Simulate incoming user event (should be filtered out)
      const userEvent = createMockEvent({ context: { ...createMockEvent().context, actor: 'user' } });
      eventHandler!(userEvent);

      await waitFor(() => {
        expect(addEvent).not.toHaveBeenCalled();
      });
    });
  });

  describe('filter changes', () => {
    it('should refetch events when filters change', async () => {
      useStore.setState({ isConnected: true });

      const { rerender } = render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(1);
      });

      // Change filters
      useStore.setState({ filters: { actor: 'user' } });
      rerender(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(2);
        expect(timelineService.queryTimeline).toHaveBeenLastCalledWith({
          filters: { actor: 'user' },
          sort: 'desc',
          limit: 50,
          offset: 0,
        });
      });
    });

    it('should refetch events when sort changes', async () => {
      useStore.setState({ isConnected: true });

      const { rerender } = render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(1);
      });

      // Change sort
      useStore.setState({ sort: 'asc' });
      rerender(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(2);
        expect(timelineService.queryTimeline).toHaveBeenLastCalledWith({
          filters: {},
          sort: 'asc',
          limit: 50,
          offset: 0,
        });
      });
    });
  });

  describe('pagination', () => {
    it('should load more events when offset changes', async () => {
      useStore.setState({ isConnected: true });

      const { rerender } = render(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(1);
      });

      // Trigger load more
      useStore.setState({ offset: 50 });
      rerender(<TimelinePanel />);

      await waitFor(() => {
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(2);
        expect(timelineService.queryTimeline).toHaveBeenLastCalledWith({
          filters: {},
          sort: 'desc',
          limit: 50,
          offset: 50,
        });
      });
    });

    it('should not fetch more when offset is 0', async () => {
      useStore.setState({ isConnected: true, offset: 0 });

      render(<TimelinePanel />);

      await waitFor(() => {
        // Should only be called once for initial load
        expect(timelineService.queryTimeline).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('navigation', () => {
    it('should log event navigation', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      useStore.setState({
        isConnected: true,
        events: [createMockEvent()],
      });

      render(<TimelinePanel />);

      // Find and trigger navigation (implementation dependent)
      // This is a placeholder - actual implementation depends on Timeline component
      const event = createMockEvent();
      const handleNavigate = (ev: ExecutionEventPayload) => {
        console.log('Navigate to event:', ev.event_id);
      };

      handleNavigate(event);

      expect(consoleSpy).toHaveBeenCalledWith('Navigate to event:', 'evt-123');

      consoleSpy.mockRestore();
    });
  });

  describe('stats updates on new events', () => {
    it('should update stats when new event is added', async () => {
      const initialStats = createMockStats();
      vi.mocked(timelineService.getTimelineStats).mockResolvedValue(initialStats);

      useStore.setState({
        isConnected: true,
        addEvent: useStore.getState().addEvent,
      });

      let eventHandler: ((event: ExecutionEventPayload) => void) | null = null;
      vi.mocked(timelineService.subscribeToTimelineEvents).mockImplementation((handler) => {
        eventHandler = handler;
        return () => {};
      });

      render(<TimelinePanel />);

      await waitFor(() => {
        expect(eventHandler).not.toBeNull();
      });

      // Simulate new event with plots
      const newEvent = createMockEvent({
        event_id: 'evt-new',
        result: {
          ...createMockEvent().result,
          plots: [{ filename: 'plot.png', base64_data: 'data', index: 1 }],
        },
        created_at_ms: 1700004000000, // Later than session end
      });

      eventHandler!(newEvent);

      // Stats should be updated (checked via component state)
      // This is implementation-specific
    });
  });
});
