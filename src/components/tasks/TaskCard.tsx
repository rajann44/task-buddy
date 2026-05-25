import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, Users, Clock } from 'lucide-react';
import type { Task } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { CATEGORY_ICONS } from '../../utils/constants';
import { formatDate, formatCurrency, truncate } from '../../utils/formatters';

interface TaskCardProps {
  task: Task;
  linkPrefix?: string; // '/client' or '/cotasker'
  showClient?: boolean;
  clientName?: string;
}

export function TaskCard({ task, linkPrefix = '/client', }: TaskCardProps) {
  const emoji = CATEGORY_ICONS[task.category] ?? '📋';

  return (
    <Link
      to={`${linkPrefix}/tasks/${task.id}`}
      style={{ textDecoration: 'none' }}
    >
      <article className="card card-hover" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Category Header */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-surface-container-low)',
          borderBottom: '1px solid var(--color-outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
            <span>{emoji}</span>
            <Tag size={13} />
            {task.category}
          </span>
          <StatusBadge status={task.status} />
        </div>

        {/* Card Body */}
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 className="text-headline-sm" style={{ color: 'var(--color-on-surface)', lineHeight: '24px' }}>
            {truncate(task.title, 70)}
          </h3>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', flex: 1 }}>
            {truncate(task.description, 110)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              {task.location} · {task.address}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={14} style={{ color: 'var(--color-tertiary)', flexShrink: 0 }} />
              {formatDate(task.date)}
              {task.time && <><Clock size={14} style={{ marginLeft: 4 }} /> {task.time}</>}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid var(--color-surface-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '18px', color: 'var(--color-on-surface)' }}>
            {task.budgetType === 'fixed' && task.budget
              ? formatCurrency(task.budget)
              : <span style={{ color: 'var(--color-tertiary)', fontSize: 'var(--text-body-sm)' }}>Open to offers</span>}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
            <Users size={14} />
            {task.offersCount} offer{task.offersCount !== 1 ? 's' : ''}
          </span>
        </div>
      </article>
    </Link>
  );
}
