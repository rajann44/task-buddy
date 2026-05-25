import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskFiltersBar } from '../../components/tasks/TaskFilters';
import { taskService } from '../../services/taskService';
import type { Task, TaskFilters } from '../../types';

export function TaskMarketplace() {
  const { currentUser } = useAuth();
  const { state } = useAppContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const open = await taskService.getOpenTasks(state.tasks);
      const filtered = await taskService.getTasks(open, filters);
      setTasks(filtered);
      setIsLoading(false);
    };
    load();
  }, [state.tasks, filters]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Guten Morgen';
    if (hr < 17) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div>
      {/* Commerzbank Greeting Header */}
      <div className="page-topbar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: 'var(--space-6) var(--space-8)' }}>
        <h1 className="text-headline-xl text-primary" style={{ margin: 0, fontWeight: 700 }}>
          {getGreeting()} {currentUser?.name}
        </h1>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: 0 }}>
          Ihre Online-Plattform für Dienstleistungen — {tasks.length} task{tasks.length !== 1 ? 's' : ''} available.
        </p>
      </div>

      <div className="page-inner">
        {/* Clipped Promo Banner (Transaction Overview spec) */}
        <div className="promo-banner">
          <div className="promo-banner-left">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600" 
              alt="Bank architecture" 
            />
          </div>
          <div className="promo-banner-right">
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500 }}>
              Sehr geehrter Kunde, für jeden geworbenen Neukunden <strong style={{ color: 'var(--color-primary-container)' }}>schenken wir Ihnen 100 €.</strong>
            </span>
            <button className="promo-card-btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}>
              Jetzt Prämie sichern
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <TaskFiltersBar filters={filters} onChange={setFilters} showStatus={false} />
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid-tasks">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} linkPrefix="" />
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No tasks found</h3>
              <p>Try adjusting your filters, or check back soon for new tasks.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
