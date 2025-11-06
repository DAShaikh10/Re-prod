import { useEffect, useState } from 'react';
import {
  type ExecutionEventPayload,
  type TimelineStats as TimelineStatsType,
  type TimelineQuery,
} from 'shared';
import { useStore } from '@/core';
import { queryTimeline, getTimelineStats, subscribeToTimelineEvents } from '@/services/timelineService';
import { Timeline } from './Timeline';
import { TimelineStats } from './TimelineStats';
import { TimelineFilters } from './TimelineFilters';
import { TimelineSort } from './TimelineSort';

const matchesFilters = (
  event: ExecutionEventPayload,
  filters: TimelineQuery['filters'] | undefined,
): boolean => {
  if (!filters) return true;

  if (filters.actor && event.context.actor !== filters.actor) {
    return false;
  }

  if (filters.source && event.context.source !== filters.source) {
    return false;
  }

  if (filters.startTime && event.created_at_ms < filters.startTime) {
    return false;
  }

  if (filters.endTime && event.created_at_ms > filters.endTime) {
    return false;
  }

  if (filters.hasPlots && event.result.plots.length === 0) {
    return false;
  }

  if (filters.hasErrors && !event.result.error) {
    return false;
  }

  if (filters.codeContains) {
    const search = filters.codeContains.toLowerCase();
    const hasMatch = event.blocks.some((block) => block.code.toLowerCase().includes(search));
    if (!hasMatch) {
      return false;
    }
  }

  return true;
};

export function TimelinePanel(): JSX.Element {
  const {
    events,
    total,
    hasMore,
    loading,
    error,
    filters,
    sort,
    limit,
    offset,
    setEvents,
    setFilters,
    setSort,
    setLoading,
    setError,
    loadMore,
    addEvent,
  } = useStore();
  const isConnected = useStore((state) => state.isConnected);

  const [stats, setStats] = useState<TimelineStatsType | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch events when filters, sort, or offset changes
  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await queryTimeline({
          filters,
          sort,
          limit,
          offset: 0, // Always start from 0 when filters/sort change
        });

        setEvents(response.events, response.total, response.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      }
    };

    fetchEvents();
  }, [filters, sort, isConnected]); // Only trigger on filter/sort changes when connected

  // Fetch more events when offset changes (for "Load More")
  useEffect(() => {
    if (!isConnected || offset === 0) return; // Skip until connection established

    const fetchMoreEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await queryTimeline({
          filters,
          sort,
          limit,
          offset,
        });

        // Append new events to existing ones
        setEvents([...events, ...response.events], response.total, response.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load more events');
      }
    };

    fetchMoreEvents();
  }, [offset, isConnected]); // Only trigger on offset changes once connected

  // Fetch stats on mount
  useEffect(() => {
    if (!isConnected) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const statsData = await getTimelineStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load timeline stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const unsubscribe = subscribeToTimelineEvents((event) => {
      if (!matchesFilters(event, filters)) {
        return;
      }

      addEvent(event);

      setStats((prev) => {
        if (!prev) {
          return prev;
        }

        const nextStart = Math.min(prev.sessionStartTime, event.created_at_ms);
        const nextEnd = Math.max(prev.sessionEndTime, event.created_at_ms);

        return {
          ...prev,
          totalEvents: prev.totalEvents + 1,
          totalPlots: prev.totalPlots + event.result.plots.length,
          totalErrors: prev.totalErrors + (event.result.error ? 1 : 0),
          userActions: prev.userActions + (event.context.actor === 'user' ? 1 : 0),
          aiActions: prev.aiActions + (event.context.actor === 'ai' ? 1 : 0),
          sessionStartTime: nextStart,
          sessionEndTime: nextEnd,
          sessionDuration: nextEnd - nextStart,
        };
      });
    });

    return unsubscribe;
  }, [isConnected, filters, addEvent]);

  const handleNavigate = (event: ExecutionEventPayload) => {
    // TODO: Implement navigation to code location
    // This will be implemented when integrating with editor
    console.log('Navigate to event:', event.event_id);

    // Future implementation:
    // - Jump to code location in editor (context.document_path, blocks[0].start_line)
    // - Show plot in plots panel (result.plots)
    // - Highlight executing cell (context.cell_index)
  };

  return (
    <div className="timeline-panel">
      <div className="timeline-panel-header">
        <h2>Timeline</h2>
      </div>

      <TimelineStats stats={stats} loading={statsLoading} />

      <div className="timeline-panel-controls">
        <TimelineFilters filters={filters} onChange={setFilters} />
        <TimelineSort sort={sort} onChange={setSort} />
      </div>

      {error && (
        <div className="timeline-error">
          <span className="timeline-error-icon">⚠️</span>
          <span className="timeline-error-message">{error}</span>
        </div>
      )}

      <div className="timeline-panel-content">
        <Timeline
          events={events}
          total={total}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadMore}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
