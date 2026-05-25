import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { TaskCard } from '../../components/tasks/TaskCard';
import { StatusBadge } from '../../components/ui/Badge';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import type { Task } from '../../types';

export function ClientDashboard() {
  const { currentUser } = useAuth();
  const { state } = useAppContext();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);

  const clientTasks = state.tasks.filter((t) => t.clientId === currentUser?.id);
  const openTasks = clientTasks.filter((t) => t.status === 'open' || t.status === 'receiving_offers');
  const activeTasks = clientTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
  const completedTasks = clientTasks.filter((t) => t.status === 'completed');
  const totalOffers = state.offers.filter((o) =>
    clientTasks.some((t) => t.id === o.taskId) && o.status === 'pending'
  ).length;

  const walletReserved = state.walletTransactions
    .filter((w) => w.clientId === currentUser?.id && w.status === 'reserved')
    .reduce((sum, w) => sum + w.amount, 0);

  useEffect(() => {
    setRecentTasks(clientTasks.slice(0, 6));
  }, [state.tasks]);

  const recentActivity = state.notifications
    .filter((n) => n.userId === currentUser?.id)
    .slice(0, 5);

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--color-on-surface)' }}>
            Good day, {currentUser?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-md)', marginTop: 'var(--space-1)' }}>
            Here's an overview of your task activity
          </p>
        </div>
        <Link to="/client/tasks/new">
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} />
            Post a Task
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 32, height: 32, background: 'var(--color-surface-container-high)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <div className="stat-value">{openTasks.length}</div>
          <div className="stat-label">Open Tasks</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 32, height: 32, background: '#EDE7F6', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} style={{ color: '#4527A0' }} />
            </div>
          </div>
          <div className="stat-value">{activeTasks.length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 32, height: 32, background: 'var(--color-status-success-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} style={{ color: 'var(--color-status-success)' }} />
            </div>
          </div>
          <div className="stat-value">{completedTasks.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <div style={{ width: 32, height: 32, background: '#fff3e0', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} style={{ color: '#E65100' }} />
            </div>
          </div>
          <div className="stat-value">{totalOffers}</div>
          <div className="stat-label">Pending Offers</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* Main content col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }} className="dashboard-grid">

          {/* Recent Tasks */}
          <div>
            <div className="section-header">
              <h2 className="text-headline-sm">Recent Tasks</h2>
              <Link to="/client/tasks" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {recentTasks.length > 0 ? (
              <div className="grid-tasks">
                {recentTasks.slice(0, 3).map((task) => (
                  <TaskCard key={task.id} task={task} linkPrefix="/client" />
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No tasks yet</h3>
                  <p style={{ marginBottom: 'var(--space-4)' }}>Post your first task and start receiving offers from trusted providers.</p>
                  <Link to="/client/tasks/new">
                    <button className="btn btn-primary">
                      <Plus size={16} /> Post First Task
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Activity side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }} className="dashboard-side-grid">
            {/* Wallet Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-headline-sm">Payments</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {walletReserved > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: '#fff3e0', borderRadius: 'var(--radius)', border: '1px solid #FFCC80' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: '#E65100' }}>Reserved</div>
                      <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>In escrow for active tasks</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '20px', color: '#E65100' }}>
                      {formatCurrency(walletReserved)}
                    </div>
                  </div>
                )}
                {state.walletTransactions
                  .filter((w) => w.clientId === currentUser?.id)
                  .slice(0, 3)
                  .map((tx) => {
                    const task = state.tasks.find((t) => t.id === tx.taskId);
                    return (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="truncate" style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500 }}>{task?.title ?? 'Task'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                          <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                          <span style={{ fontWeight: 700, fontSize: 'var(--text-body-sm)' }}>{formatCurrency(tx.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                {state.walletTransactions.filter((w) => w.clientId === currentUser?.id).length === 0 && (
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: 'var(--space-4)' }}>
                    No payment activity yet
                  </p>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-headline-sm">Recent Activity</h3>
                <Link to="/notifications" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  View all
                </Link>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '280px' }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((notif) => (
                    <div key={notif.id} style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--color-surface-container)',
                      opacity: notif.isRead ? 0.7 : 1,
                    }}>
                      <div style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 'var(--text-body-sm)', marginBottom: '2px' }}>{notif.title}</div>
                      <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{formatRelativeTime(notif.createdAt)}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Tasks (assigned/in_progress) */}
          {activeTasks.length > 0 && (
            <div>
              <div className="section-header">
                <h2 className="text-headline-sm">Active Jobs</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activeTasks.map((task) => (
                  <Link key={task.id} to={`/client/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="truncate" style={{ fontWeight: 600, color: 'var(--color-on-surface)', fontSize: 'var(--text-body-md)' }}>{task.title}</div>
                        <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>{task.category} · {task.location}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                        <StatusBadge status={task.status} />
                        <ArrowRight size={16} style={{ color: 'var(--color-on-surface-variant)' }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .dashboard-side-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
