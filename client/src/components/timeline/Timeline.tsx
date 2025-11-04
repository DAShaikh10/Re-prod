import { type ExecutionEventPayload } from 'shared';
import { TimelineEvent } from './TimelineEvent';

interface TimelineProps {
  events: ExecutionEventPayload[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onNavigate?: (event: ExecutionEventPayload) => void;
}

export function Timeline({
  events,
  total,
  hasMore,
  loading,
  onLoadMore,
  onNavigate,
}: TimelineProps): JSX.Element {
  if (events.length === 0 && !loading) {
    return (
      <div className="timeline-empty">
        <div className="timeline-empty-message">No execution events yet</div>
        <div className="timeline-empty-hint">
          Execute some R code to see the timeline
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-list">
        {events.map((event) => (
          <TimelineEvent key={event.event_id} event={event} onNavigate={onNavigate} />
        ))}
      </div>

      {loading && (
        <div className="timeline-loading">
          <div className="timeline-spinner" />
          <span>Loading events...</span>
        </div>
      )}

      {hasMore && !loading && (
        <button className="timeline-load-more" onClick={onLoadMore}>
          Load More ({total - events.length} remaining)
        </button>
      )}

      {!hasMore && events.length > 0 && (
        <div className="timeline-end">
          Showing all {total} event{total !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
