import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, CheckCircle, Calendar, Briefcase } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { useAppContext } from '../../context/AppContext';
import { Avatar } from '../../components/ui/Avatar';
import { ProfileBadge } from '../../components/ui/Badge';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { TASK_CATEGORIES } from '../../utils/constants';
import type { User, CoTaskerProfile, ClientProfile } from '../../types';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAppContext();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [coTaskerProfile, setCoTaskerProfile] = useState<CoTaskerProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      const [u, co, cl] = await Promise.all([
        profileService.getUserById(id),
        profileService.getCoTaskerProfile(id),
        profileService.getClientProfile(id),
      ]);
      setUser(u);
      setCoTaskerProfile(co);
      setClientProfile(cl);
      setIsLoading(false);
    };
    load();
  }, [id]);

  const reviews = state.reviews.filter((r) => r.toUserId === id);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  if (!user) {
    return <div className="empty-state"><h3>User not found</h3></div>;
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-5)' }} className="profile-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Main profile card */}
          <div className="card">
            <div style={{ background: 'var(--color-secondary)', height: '100px', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
            <div className="card-body" style={{ position: 'relative', paddingTop: 0 }}>
              <div style={{ marginTop: -48, marginBottom: 'var(--space-3)' }}>
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="xl"
                  style={{ border: '4px solid var(--color-surface-white)', boxShadow: 'var(--shadow-sm)' } as any} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h1 className="text-headline-md">{user.name}</h1>
                  <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', marginTop: '4px', textTransform: 'capitalize' }}>
                    {user.role === 'cotasker' ? 'Service Provider' : 'Client'}
                  </p>
                </div>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '22px' }}>
                    <Star size={20} fill="var(--color-primary-container)" color="var(--color-primary)" />
                    {avgRating}
                    <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', fontWeight: 400, fontFamily: 'var(--font-body)' }}>
                      ({reviews.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Co-Tasker specific */}
              {coTaskerProfile && (
                <>
                  <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: 'var(--lh-body-lg)', marginBottom: 'var(--space-4)' }}>
                    {coTaskerProfile.bio}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                    {coTaskerProfile.isVerified && <ProfileBadge type="verified" />}
                    {coTaskerProfile.isTopRated && <ProfileBadge type="top-rated" />}
                    {coTaskerProfile.isFastResponder && <ProfileBadge type="fast" />}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} />{coTaskerProfile.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} />Responds in {coTaskerProfile.responseTime}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} />{coTaskerProfile.completedJobs} jobs completed</span>
                  </div>

                  {/* Categories */}
                  <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-surface-container)' }}>
                    <div className="stat-label" style={{ marginBottom: 'var(--space-2)' }}>Skills & Categories</div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      {coTaskerProfile.categories.map((cat) => (
                        <span key={cat} className="chip chip-active">{cat}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Client specific */}
              {clientProfile && user.role === 'client' && (
                <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} />Member since {formatDate(clientProfile.createdAt)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} />{clientProfile.tasksPosted} tasks posted</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-3)' }}>
              Reviews ({reviews.length})
            </h2>
            {reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {reviews.map((review) => {
                  const fromUser = state.offers.find(o => o.coTaskerId === review.fromUserId);
                  return (
                    <div key={review.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ fontSize: '18px' }}>{s <= review.rating ? '⭐' : '☆'}</span>
                          ))}
                        </div>
                        <p style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic', marginBottom: 'var(--space-2)' }}>
                          "{review.comment}"
                        </p>
                        <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>
                          {formatRelativeTime(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <h3 style={{ marginBottom: 'var(--space-2)' }}>No reviews yet</h3>
                  <p>Reviews will appear here after completed tasks.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {coTaskerProfile && (
            <>
              {/* Stats card */}
              <div className="card">
                <div className="card-header"><h3 className="text-headline-sm">Stats</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
                      <div className="stat-value" style={{ fontSize: '24px' }}>{coTaskerProfile.rating}</div>
                      <div className="stat-label">Rating</div>
                    </div>
                    <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
                      <div className="stat-value" style={{ fontSize: '24px' }}>{coTaskerProfile.reviewCount}</div>
                      <div className="stat-label">Reviews</div>
                    </div>
                    <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
                      <div className="stat-value" style={{ fontSize: '24px' }}>{coTaskerProfile.completedJobs}</div>
                      <div className="stat-label">Jobs Done</div>
                    </div>
                    <div className="stat-card" style={{ padding: 'var(--space-3)' }}>
                      <div className="stat-value" style={{ fontSize: '24px' }}>{coTaskerProfile.responseTime}</div>
                      <div className="stat-label">Response</div>
                    </div>
                  </div>
                  {coTaskerProfile.hourlyRate && (
                    <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)' }}>
                      <div className="stat-label" style={{ marginBottom: '4px' }}>Hourly Rate</div>
                      <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '22px' }}>
                        {formatCurrency(coTaskerProfile.hourlyRate)}/hr
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
