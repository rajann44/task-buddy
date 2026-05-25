import { Search, Filter, X } from 'lucide-react';
import type { TaskFilters } from '../../types';
import { TASK_CATEGORIES, AUSTRALIAN_CITIES, STATUS_LABELS } from '../../utils/constants';

interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  showStatus?: boolean;
}

export function TaskFiltersBar({ filters, onChange, showStatus = false }: TaskFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '' && v !== 0
  );

  const update = (key: keyof TaskFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const clear = () => onChange({});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-on-surface-variant)',
          }}
        />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search ?? ''}
          onChange={(e) => update('search', e.target.value)}
          className="form-input"
          style={{ paddingLeft: '36px' }}
          aria-label="Search tasks"
        />
      </div>

      {/* Filter chips row */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--color-on-surface-variant)', flexShrink: 0 }} />

        {/* Category */}
        <select
          value={filters.category ?? ''}
          onChange={(e) => update('category', e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '5px var(--space-3)', fontSize: 'var(--text-body-sm)' }}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* City */}
        <select
          value={filters.city ?? ''}
          onChange={(e) => update('city', e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '5px var(--space-3)', fontSize: 'var(--text-body-sm)' }}
          aria-label="Filter by city"
        >
          <option value="">All Cities</option>
          {AUSTRALIAN_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status */}
        {showStatus && (
          <select
            value={filters.status ?? ''}
            onChange={(e) => update('status', e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '5px var(--space-3)', fontSize: 'var(--text-body-sm)' }}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )}

        {/* Budget range */}
        <input
          type="number"
          placeholder="Min €"
          value={filters.budgetMin ?? ''}
          onChange={(e) => update('budgetMin', e.target.value ? Number(e.target.value) : undefined)}
          className="form-input"
          style={{ width: '90px', padding: '5px var(--space-3)', fontSize: 'var(--text-body-sm)' }}
          min={0}
          aria-label="Minimum budget"
        />
        <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)' }}>–</span>
        <input
          type="number"
          placeholder="Max €"
          value={filters.budgetMax ?? ''}
          onChange={(e) => update('budgetMax', e.target.value ? Number(e.target.value) : undefined)}
          className="form-input"
          style={{ width: '90px', padding: '5px var(--space-3)', fontSize: 'var(--text-body-sm)' }}
          min={0}
          aria-label="Maximum budget"
        />

        {hasActiveFilters && (
          <button
            onClick={clear}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
