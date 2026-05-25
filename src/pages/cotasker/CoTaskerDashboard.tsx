import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, CheckCircle, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { profileService } from '../../services/profileService';
import { TaskCard } from '../../components/tasks/TaskCard';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import type { CoTaskerProfile } from '../../types';

export function CoTaskerDashboard() {
  const { currentUser } = useAuth();
  const { state } = useAppContext();
  const [profile, setProfile] = useState<CoTaskerProfile | null>(null);

  useEffect(() => {
    if (currentUser) profileService.getCoTaskerProfile(currentUser.id).then(setProfile);
  }, [currentUser]);

  const myOffers = state.offers.filter((o) => o.coTaskerId === currentUser?.id);
  const pendingOffers = myOffers.filter((o) => o.status === 'pending');
  const assignedTasks = state.tasks.filter((t) => t.assignedCoTaskerId === currentUser?.id);
  const activeTasks = assignedTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
  const completedTasks = assignedTasks.filter((t) => t.status === 'completed');
  const myReviews = state.reviews.filter((r) => r.toUserId === currentUser?.id).slice(0, 3);

  const totalEarned = state.walletTransactions
    .filter((w) => w.coTaskerId === currentUser?.id && w.status === 'released')
    .reduce((sum, w) => sum + w.amount, 0);

  const openTasksCount = state.tasks.filter(
    (t) => t.status === 'open' || t.status === 'receiving_offers'
  ).length;

  const recentActivity = state.notifications
    .filter((n) => n.userId === currentUser?.id)
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="text-headline-lg">
            Welcome back, {currentUser?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
            {profile ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={14} fill="var(--color-primary-container)" color="var(--color-primary)" />
                {profile.rating} rating · {profile.reviewCount} reviews · {profile.responseTime} response time
              </span>
            ) : 'Your provider dashboard'}
          </p>
        </div>
        <Link to="/cotasker/tasks">
          <button className="btn btn-primary">Browse Tasks →</button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div style={{ width: 32, height: 32, background: '#fff3e0', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <TrendingUp size={16} style={{ color: '#E65100' }} />
          </div>
          <div className="stat-value">{pendingOffers.length}</div>
          <div className="stat-label">Pending Offers</div>
        </div>
        <div className="stat-card">
          <div style={{ width: 32, height: 32, background: '#EDE7F6', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <Clock size={16} style={{ color: '#4527A0' }} />
          </div>
          <div className="stat-value">{activeTasks.length}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div style={{ width: 32, height: 32, background: 'var(--color-status-success-bg)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <CheckCircle size={16} style={{ color: 'var(--color-status-success)' }} />
          </div>
          <div className="stat-value">{completedTasks.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div style={{ width: 32, height: 32, background: 'var(--color-surface-container-high)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{formatCurrency(totalEarned || (profile?.totalEarnings ?? 0))}</div>
          <div className="stat-label">Total Earned</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }} className="ct-dash-grid">
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Open market banner */}
          <div style={{
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5) var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '4px' }}>
                {openTasksCount} tasks available near you
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--text-body-sm)' }}>
                New tasks posted today. Be the first to offer!
              </div>
            </div>
            <Link to="/cotasker/tasks" style={{ flexShrink: 0, zIndex: 1 }}>
              <button style={{
                background: 'var(--color-primary-container)',
                color: 'var(--color-on-primary-container)',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '10px var(--space-5)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--text-body-sm)',
              }}>
                Browse All <ArrowRight size={14} />
              </button>
            </Link>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,215,0,0.08)' }} />
          </div>

          {/* Active Jobs */}
          {activeTasks.length > 0 && (
            <div>
              <div className="section-header">
                <h2 className="text-headline-sm">Active Jobs</h2>
                <Link to="/cotasker/jobs" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  View all <ArrowRight size={14} style={{ display: 'inline' }} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activeTasks.map((task) => (
                  <Link key={task.id} to={`/cotasker/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="truncate" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{task.title}</div>
                        <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>{task.location} · {task.category}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                        <StatusBadge status={task.status} />
                        <ArrowRight size={16} style={{ color: 'var(--color-on-surface-variant)' }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent reviews */}
          {myReviews.length > 0 && (
            <div>
              <div className="section-header">
                <h2 className="text-headline-sm">Recent Reviews</h2>
                <Link to={`/profile/${currentUser?.id}`} style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  View profile
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {myReviews.map((review) => (
                  <div key={review.id} className="card">
                    <div className="card-body">
                      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: '16px' }}>{s <= review.rating ? '⭐' : '☆'}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>"{review.comment}"</p>
                      <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-2)' }}>
                        {formatRelativeTime(review.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Profile card */}
          {profile && currentUser && (
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-3)' }}>
                <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="xl" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-body-lg)' }}>{currentUser.name}</div>
                  <div style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)' }}>{profile.location}</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  {profile.isVerified && <span className="badge badge-verified">✓ Verified</span>}
                  {profile.isTopRated && <span className="badge badge-top-rated">⭐ Top Rated</span>}
                  {profile.isFastResponder && <span className="badge badge-fast">⚡ Fast</span>}
                </div>
                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-surface-container)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '22px' }}>{profile.rating}</div>
                    <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '22px' }}>{profile.completedJobs}</div>
                    <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>Jobs Done</div>
                  </div>
                </div>
                <Link to={`/profile/${currentUser.id}`} style={{ width: '100%' }}>
                  <button className="btn btn-outlined w-full">View Public Profile</button>
                </Link>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-headline-sm">Activity</h3>
              <Link to="/notifications" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>All</Link>
            </div>
            <div>
              {recentActivity.length > 0 ? (
                recentActivity.map((n) => (
                  <div key={n.id} style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-surface-container)', opacity: n.isRead ? 0.7 : 1 }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 'var(--text-body-sm)' }}>{n.title}</div>
                    <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>{formatRelativeTime(n.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .ct-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
