import { useEffect, useState } from 'react';
import { type ExecutionEventPayload, type TimelineStats as TimelineStatsType } from 'shared';
import { useStore } from '@/core';
import { queryTimeline, getTimelineStats } from '@/services/timelineService';
import { Timeline } from './Timeline';
import { TimelineStats } from './TimelineStats';
import { TimelineFilters } from './TimelineFilters';
import { TimelineSort } from './TimelineSort';

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
