import { type TimelineQuery } from 'shared';

interface TimelineFiltersProps {
  filters: TimelineQuery['filters'];
  onChange: (filters: TimelineQuery['filters']) => void;
}

export function TimelineFilters({ filters = {}, onChange }: TimelineFiltersProps): JSX.Element {
  const handleActorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filters,
      actor: value === 'all' ? undefined : (value as 'user' | 'ai'),
    });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onChange({
      ...filters,
      source: value === 'all' ? undefined : (value as 'selection' | 'cell' | 'whole_document'),
    });
  };

  const handlePlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      hasPlots: e.target.checked ? true : undefined,
    });
  };

  const handleErrorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      hasErrors: e.target.checked ? true : undefined,
    });
  };

  const handleCodeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange({
      ...filters,
      codeContains: value ? value : undefined,
    });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="timeline-filters">
      <div className="timeline-filters-row">
        <div className="timeline-filter">
          <label htmlFor="filter-actor">Actor:</label>
          <select
            id="filter-actor"
            value={filters.actor || 'all'}
            onChange={handleActorChange}
          >
            <option value="all">All</option>
            <option value="user">👤 User</option>
            <option value="ai">🤖 AI</option>
          </select>
        </div>

        <div className="timeline-filter">
          <label htmlFor="filter-source">Source:</label>
          <select
            id="filter-source"
            value={filters.source || 'all'}
            onChange={handleSourceChange}
          >
            <option value="all">All</option>
            <option value="selection">Selection</option>
            <option value="cell">Cell</option>
            <option value="whole_document">Document</option>
          </select>
        </div>

        <div className="timeline-filter timeline-filter-checkbox">
          <input
            type="checkbox"
            id="filter-plots"
            checked={filters.hasPlots || false}
            onChange={handlePlotsChange}
          />
          <label htmlFor="filter-plots">📊 With Plots</label>
        </div>

        <div className="timeline-filter timeline-filter-checkbox">
          <input
            type="checkbox"
            id="filter-errors"
            checked={filters.hasErrors || false}
            onChange={handleErrorsChange}
          />
          <label htmlFor="filter-errors">❌ With Errors</label>
        </div>
      </div>

      <div className="timeline-filters-row">
        <div className="timeline-filter timeline-filter-search">
          <label htmlFor="filter-code">Code contains:</label>
          <input
            type="text"
            id="filter-code"
            placeholder="Search code..."
            value={filters.codeContains || ''}
            onChange={handleCodeSearchChange}
          />
        </div>

        {hasActiveFilters && (
          <button className="timeline-filter-clear" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
