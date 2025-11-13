import { useCallback } from 'react';
import type { ExecutionEventPayload } from 'shared';

import { useStore } from '@/core';
import { useTimelineData } from '@/hooks/useTimelineData';
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
    setFilters,
    setSort,
    loadMore,
    stats,
    statsLoading,
  } = useTimelineData();

  const editorRef = useStore((state) => state.editorRef);

  const handleNavigate = useCallback(
    (event: ExecutionEventPayload) => {
      const targetEditor = editorRef?.current;
      if (!targetEditor) {
        return;
      }

      const line = event.blocks?.[0]?.start_line;
      if (line === undefined) {
        return;
      }

      targetEditor.navigateToLine(line);
    },
    [editorRef],
  );

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
