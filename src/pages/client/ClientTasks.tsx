import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskFiltersBar } from '../../components/tasks/TaskFilters';
import type { Task, TaskFilters } from '../../types';
import { taskService } from '../../services/taskService';

export function ClientTasks() {
  const { currentUser } = useAuth();
  const { state } = useAppContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const clientTasks = await taskService.getTasksByClient(state.tasks, currentUser!.id);
      const filtered = await taskService.getTasks(clientTasks, filters);
      setTasks(filtered);
      setIsLoading(false);
    };
    load();
  }, [state.tasks, filters, currentUser]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="text-headline-lg">My Tasks</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/client/tasks/new">
          <button className="btn btn-primary">
            <Plus size={16} /> Post Task
          </button>
        </Link>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <TaskFiltersBar filters={filters} onChange={setFilters} showStatus />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid-tasks">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} linkPrefix="/client" />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No tasks found</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters'
                : "You haven't posted any tasks yet."}
            </p>
            <Link to="/client/tasks/new">
              <button className="btn btn-primary"><Plus size={16} /> Post First Task</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
