import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { StatusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';
import { ArrowRight, CheckCircle, Clock } from 'lucide-react';

export function CoTaskerJobs() {
  const { currentUser } = useAuth();
  const { state } = useAppContext();

  const myJobs = state.tasks
    .filter((t) => t.assignedCoTaskerId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const active = myJobs.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
  const completed = myJobs.filter((t) => t.status === 'completed');

  const totalEarned = state.walletTransactions
    .filter((w) => w.coTaskerId === currentUser?.id && w.status === 'released')
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-headline-lg">My Jobs</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
          {active.length} active · {completed.length} completed · {formatCurrency(totalEarned)} total earned
        </p>
      </div>

      {/* Active Jobs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-header">
          <h2 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={18} /> Active Jobs
          </h2>
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>{active.length}</span>
        </div>
        {active.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {active.map((task) => {
              const myOffer = state.offers.find(
                (o) => o.taskId === task.id && o.coTaskerId === currentUser?.id && o.status === 'accepted'
              );
              return (
                <Link key={task.id} to={`/cotasker/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover">
                    <div className="card-body">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                            <span>{CATEGORY_ICONS[task.category]}</span>
                            <StatusBadge status={task.status} />
                          </div>
                          <div className="truncate" style={{ fontWeight: 700, fontSize: 'var(--text-body-md)', color: 'var(--color-on-surface)' }}>{task.title}</div>
                          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                            {task.location} · {formatDate(task.date)} · {task.category}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {myOffer && (
                            <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '20px', marginBottom: '4px' }}>
                              {formatCurrency(myOffer.price)}
                            </div>
                          )}
                          <ArrowRight size={20} style={{ color: 'var(--color-on-surface-variant)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon"><Clock size={40} /></div>
              <h3 className="text-headline-sm">No active jobs</h3>
              <p>Your accepted jobs will appear here.</p>
              <Link to="/cotasker/tasks">
                <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Browse Tasks</button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Completed Jobs */}
      {completed.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={18} /> Completed Jobs
            </h2>
            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>{completed.length}</span>
          </div>
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Earned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((task) => {
                    const tx = state.walletTransactions.find(
                      (w) => w.taskId === task.id && w.coTaskerId === currentUser?.id
                    );
                    return (
                      <tr key={task.id}>
                        <td>
                          <Link to={`/cotasker/tasks/${task.id}`} style={{ fontWeight: 600, color: 'var(--color-on-surface)', textDecoration: 'none' }}>
                            {task.title}
                          </Link>
                        </td>
                        <td>{CATEGORY_ICONS[task.category]} {task.category}</td>
                        <td>{formatDate(task.date)}</td>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-headline)' }}>
                          {tx ? formatCurrency(tx.amount) : '—'}
                        </td>
                        <td><StatusBadge status={task.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
