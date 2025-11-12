import type { ExecutionEventPayload } from 'shared';

import { Timeline } from './Timeline';
import { TimelineStats } from './TimelineStats';
import { TimelineFilters } from './TimelineFilters';
import { TimelineSort } from './TimelineSort';
import { useTimelineData } from '@/hooks/useTimelineData';

export function TimelinePanel(): JSX.Element {
  const {
    events,
    total,
    hasMore,
    loading,
    error,
    filters,
    sort,
    setFilters,
    setSort,
    loadMore,
    stats,
    statsLoading,
  } = useTimelineData();

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
