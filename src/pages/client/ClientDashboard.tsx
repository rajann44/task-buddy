import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, CheckCircle, Clock, AlertCircle, ArrowRight, Wallet, Bell, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
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
      <div className="page-topbar">
        <div>
          <h1 className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>
            Good day, {currentUser?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: '4px 0 0 0' }}>
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

      <div className="page-inner">
        {/* Stats Grid */}
        <div className="grid-stats mb-6">
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--color-surface-container-low)' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-secondary-mid)' }} />
            </div>
            <div className="stat-value">{openTasks.length}</div>
            <div className="stat-label">Open Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'rgba(69, 39, 160, 0.08)' }}>
              <Clock size={18} style={{ color: '#4527A0' }} />
            </div>
            <div className="stat-value">{activeTasks.length}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--color-status-success-bg)' }}>
              <CheckCircle size={18} style={{ color: 'var(--color-status-success)' }} />
            </div>
            <div className="stat-value">{completedTasks.length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ background: 'var(--color-status-warning-bg)' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-status-warning)' }} />
            </div>
            <div className="stat-value">{totalOffers}</div>
            <div className="stat-label">Pending Offers</div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="bento-grid">
          {/* Left Column: Recent Tasks & Active Jobs */}
          <div className="bento-col-8 flex flex-col gap-6">
            {/* Recent Tasks Table */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-headline-sm" style={{ fontWeight: 700 }}>Recent Tasks</h3>
                <Link to="/client/tasks" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-secondary)' }}>
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              
              {recentTasks.length > 0 ? (
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Category</th>
                        <th>Budget</th>
                        <th>Status</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.slice(0, 5).map((task) => (
                        <tr key={task.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{task.title}</div>
                            <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{task.location}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>{task.category}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {task.budget !== undefined ? formatCurrency(task.budget) : 'Open Budget'}
                          </td>
                          <td>
                            <StatusBadge status={task.status} />
                          </td>
                          <td>
                            <Link to={`/client/tasks/${task.id}`}>
                              <button className="btn btn-ghost btn-icon">
                                <ArrowRight size={16} />
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
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
              )}
            </div>

            {/* Active Tasks list */}
            {activeTasks.length > 0 && (
              <div>
                <div className="section-label">Active Work</div>
                <div className="flex flex-col gap-3">
                  {activeTasks.map((task) => (
                    <Link key={task.id} to={`/client/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-hover" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
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

          {/* Right Column: Quick Actions, Payments, Activity */}
          <div className="bento-col-4 flex flex-col gap-6">
            {/* Quick Actions Bento Card */}
            <div className="bento-card flex flex-col gap-4">
              <div className="section-label" style={{ marginBottom: 0 }}>Quick Actions</div>
              
              <Link to="/client/tasks/new" style={{ width: '100%' }}>
                <button className="quick-action-primary">
                  <span>Post a New Task</span>
                  <Plus size={20} />
                </button>
              </Link>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <Link to="/client/offers">
                  <button className="btn btn-outlined w-full" style={{ padding: '12px var(--space-2)', display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Offers</span>
                  </button>
                </Link>
                <Link to={`/profile/${currentUser?.id}`}>
                  <button className="btn btn-outlined w-full" style={{ padding: '12px var(--space-2)', display: 'flex', flexDirection: 'column', gap: '6px', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} />
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Profile</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Payments Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Wallet size={16} />
                  Payments
                </h3>
              </div>
              <div className="card-body" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {walletReserved > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--color-status-warning-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--color-outline-variant)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-status-warning)' }}>Escrow Hold</div>
                      <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>Reserved for active tasks</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '20px', color: 'var(--color-status-warning)' }}>
                      {formatCurrency(walletReserved)}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {state.walletTransactions
                    .filter((w) => w.clientId === currentUser?.id)
                    .slice(0, 3)
                    .map((tx) => {
                      const task = state.tasks.find((t) => t.id === tx.taskId);
                      return (
                        <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-body-sm)' }}>
                          <div style={{ minWidth: 0 }}>
                            <div className="truncate" style={{ fontWeight: 500 }}>{task?.title ?? 'Task Funding'}</div>
                            <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>
                              {tx.status === 'reserved' ? 'Reserved' : tx.status === 'released' ? 'Paid' : 'Refunded'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                            <span style={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</span>
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
            </div>

            {/* Recent Activity Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Bell size={16} />
                  Recent Activity
                </h3>
                <Link to="/notifications" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)', fontWeight: 600 }}>
                  View all
                </Link>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '280px' }}>
                {recentActivity.length > 0 ? (
                  recentActivity.map((notif) => (
                    <div key={notif.id} className="activity-item" style={{ opacity: notif.isRead ? 0.7 : 1 }}>
                      {!notif.isRead && <div className="unread-dot" />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                          {formatRelativeTime(notif.createdAt)}
                        </div>
                      </div>
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
        </div>
      </div>
    </div>
  );
}
