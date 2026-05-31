import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Briefcase, Star, ArrowRight, Wallet, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext, applyCoTaskerAction } from '../context/AppContext';
import { StatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { CATEGORY_ICONS } from '../utils/constants';
import { useTranslation } from '../context/LanguageContext';
import posthog from '../utils/posthogClient';
import { supabase } from '../utils/supabaseClient';

export function MyTasksPage() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'client';
  const { t } = useTranslation();

  // Application Form States
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [rate, setRate] = useState('25');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim() || !rate || !currentUser) return;
    setIsSubmitting(true);
    
    try {
      // 1. Update user co_tasker_status in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ co_tasker_status: 'pending' })
        .eq('id', currentUser.id);
      
      if (userError) throw userError;

      // 2. Upsert the cotasker profile
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      const { error: profileError } = await supabase
        .from('cotasker_profiles')
        .upsert({
          user_id: currentUser.id,
          bio: bio.trim(),
          skills: skillsArray,
          hourly_rate: Number(rate),
          location: 'Berlin',
          availability: 'Flexible',
        });

      if (profileError) throw profileError;

      dispatch(applyCoTaskerAction(currentUser.id));
      posthog.capture('cotasker_application_submitted', {
        hourly_rate: Number(rate),
      });
      updateCurrentUser({ coTaskerStatus: 'pending' });
    } catch (err: any) {
      console.error('Failed to submit Co-Tasker application:', err);
      alert(err.message || 'Failed to submit application to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dbUser = state.users.find((u) => u.id === currentUser?.id) || currentUser;

  // ── Client Calculations ──
  const clientTasks = state.tasks.filter((t) => t.clientId === currentUser?.id);
  const postedAds = clientTasks.filter((t) => t.status === 'open' || t.status === 'receiving_offers');
  const bookedTasks = clientTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
  const completedTasks = clientTasks.filter((t) => t.status === 'completed' || t.status === 'cancelled');

  const totalEscrow = state.walletTransactions
    .filter((w) => w.clientId === currentUser?.id && w.status === 'reserved')
    .reduce((sum, w) => sum + w.amount, 0);

  // ── Co-Tasker Calculations ──
  const myOffers = state.offers
    .filter((o) => o.coTaskerId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myAssignedTasks = state.tasks
    .filter((t) => t.assignedCoTaskerId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeJobs = myAssignedTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress');
  const completedJobs = myAssignedTasks.filter((t) => t.status === 'completed');

  const totalEarned = state.walletTransactions
    .filter((w) => w.coTaskerId === currentUser?.id && w.status === 'released')
    .reduce((sum, w) => sum + w.amount, 0);

  const setTab = (tab: 'client' | 'tasker') => {
    setSearchParams({ tab });
  };

  return (
    <div>
      {/* Sticky Header */}
      <div className="page-topbar">
        <div>
          <h1 className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{t('nav.my_tasks')}</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: '4px 0 0 0' }}>
            Manage tasks you have posted or jobs you are working on
          </p>
        </div>
        {activeTab === 'client' && (
          <Link to="/tasks/new">
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={16} /> {t('tasks.post_task')}
            </button>
          </Link>
        )}
      </div>

      <div className="page-inner">
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-surface-container-highest)', paddingBottom: 'var(--space-2)' }}>
          <button
            onClick={() => setTab('client')}
            className={`chip ${activeTab === 'client' ? 'chip-active' : ''}`}
            style={{ padding: '8px var(--space-4)', fontSize: 'var(--text-body-sm)', borderRadius: 'var(--radius)' }}
          >
            I am a Client ({clientTasks.length})
          </button>
          <button
            onClick={() => setTab('tasker')}
            className={`chip ${activeTab === 'tasker' ? 'chip-active' : ''}`}
            style={{ padding: '8px var(--space-4)', fontSize: 'var(--text-body-sm)', borderRadius: 'var(--radius)' }}
          >
            I am a Tasker ({myOffers.length + myAssignedTasks.length})
          </button>
        </div>

        {/* Commerzbank Bento Grid (Startpage SPEC) */}
        <div className="bento-grid" style={{ marginBottom: 'var(--space-8)' }}>
          {activeTab === 'client' ? (
            <>
              {/* GiroKonto styled Escrow Card */}
              <div className="bento-col-4 card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-container-low)',
                    border: '1.5px solid var(--color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-secondary)'
                  }}>
                    <Wallet size={20} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GiroKonto Style</span>
                </div>
                <div>
                  <h3 className="text-headline-md" style={{ color: 'var(--color-secondary)', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>Task Deposits (Escrow)</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', margin: 0 }}>{currentUser?.name}</p>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                    {formatCurrency(totalEscrow)}
                  </div>
                  <div className="text-label" style={{ fontSize: '9px', color: 'var(--color-status-success)', marginTop: '4px', fontWeight: 700 }}>
                    Active Escrow Funds
                  </div>
                </div>
              </div>

              {/* Promo Card 1: Explore Services (Dark Spec) */}
              <div className="bento-col-4 promo-card-dark" style={{ minHeight: '260px' }}>
                <div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '16px', fontWeight: 700 }}>Explore Services</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', opacity: 0.85, lineHeight: '18px', margin: 0 }}>
                    Browse open listings to see what other clients are posting, or check out available service categories.
                  </p>
                </div>
                <Link to="/browse" className="promo-card-btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}>
                  Browse Marketplace →
                </Link>
              </div>

              {/* Promo Card 2: Security & Verification (Light Spec) */}
              <div className="bento-col-4 promo-card-light" style={{ minHeight: '260px' }}>
                <div>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(0,46,60,0.06)', borderRadius: 'var(--radius)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Star size={18} style={{ color: 'var(--color-secondary)' }} />
                  </div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 8px 0', color: 'var(--color-secondary)', fontSize: '16px', fontWeight: 700 }}>Verified Status</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', lineHeight: '18px', margin: 0 }}>
                    Keep your profile trust rating high. Verify your email, phone, and complete your checklist profile.
                  </p>
                </div>
                <Link to={`/profile/${currentUser?.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)' }}>
                  Go to Profile →
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* GiroKonto styled Earnings Card */}
              <div className="bento-col-4 card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-surface-container-low)',
                    border: '1.5px solid var(--color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-secondary)'
                  }}>
                    <TrendingUp size={20} />
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GiroKonto Style</span>
                </div>
                <div>
                  <h3 className="text-headline-md" style={{ color: 'var(--color-secondary)', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>Released Earnings</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', margin: 0 }}>{currentUser?.name}</p>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                    {formatCurrency(totalEarned)}
                  </div>
                  <div className="text-label" style={{ fontSize: '9px', color: 'var(--color-status-success)', marginTop: '4px', fontWeight: 700 }}>
                    Total Released Balance
                  </div>
                </div>
              </div>

              {/* Promo Card 1: Find Available Work (Dark Spec) */}
              <div className="bento-col-4 promo-card-dark" style={{ minHeight: '260px' }}>
                <div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 8px 0', color: '#ffffff', fontSize: '16px', fontWeight: 700 }}>Find Available Work</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', opacity: 0.85, lineHeight: '18px', margin: 0 }}>
                    Review recent postings in your category and submit offers with your estimated effort to start earning.
                  </p>
                </div>
                <Link to="/browse" className="promo-card-btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}>
                  Browse Tasks →
                </Link>
              </div>

              {/* Promo Card 2: Profile Rating (Light Spec) */}
              <div className="bento-col-4 promo-card-light" style={{ minHeight: '260px' }}>
                <div>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(0,46,60,0.06)', borderRadius: 'var(--radius)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <Briefcase size={18} style={{ color: 'var(--color-secondary)' }} />
                  </div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 8px 0', color: 'var(--color-secondary)', fontSize: '16px', fontWeight: 700 }}>Service Quality</h3>
                  <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', lineHeight: '18px', margin: 0 }}>
                    You have submitted {myOffers.length} offers. Keep responding quickly to maintain your "Top Rated" status badge.
                  </p>
                </div>
                <Link to={`/profile/${currentUser?.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)' }}>
                  View Client Reviews →
                </Link>
              </div>
            </>
          )}
        </div>

        {activeTab === 'client' ? (
          /* ─────────────────────────────────────────────────────────────────
             CLIENT VIEW
             ───────────────────────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Posted Ads */}
            <div>
              <div className="section-label">Posted Ads ({postedAds.length})</div>
              {postedAds.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {postedAds.map((task) => (
                    <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-hover">
                        <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <span className="section-label" style={{ margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{CATEGORY_ICONS[task.category]}</span> {task.category}
                                </span>
                                <StatusBadge status={task.status === 'open' && task.offersCount > 0 ? 'receiving_offers' : task.status} />
                                {task.moderationStatus === 'pending' && (
                                  <span className="badge badge-pending" style={{ fontSize: '10px' }}>⏳ {t('tasks.moderation_pending_badge')}</span>
                                )}
                                {task.moderationStatus === 'rejected' && (
                                  <span className="badge badge-rejected" style={{ fontSize: '10px' }}>⚠️ {t('tasks.moderation_rejected_badge')}</span>
                                )}
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-secondary)' }}>{task.title}</div>
                              <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                                {task.location} · Posted {formatDate(task.createdAt)}
                              </div>
                              {task.moderationStatus === 'rejected' && (
                                <div style={{ 
                                  marginTop: '8px', 
                                  padding: '6px 12px', 
                                  background: 'rgba(211, 47, 47, 0.06)', 
                                  borderLeft: '3px solid var(--color-status-error)', 
                                  fontSize: '12px', 
                                  color: 'var(--color-status-error)',
                                  borderRadius: '0 4px 4px 0',
                                  fontWeight: 500
                                }}>
                                  {t('tasks.moderation_rejected_desc')}
                                </div>
                              )}
                              {task.moderationStatus === 'pending' && (
                                <div style={{ 
                                  marginTop: '8px', 
                                  padding: '6px 12px', 
                                  background: 'rgba(245, 127, 23, 0.06)', 
                                  borderLeft: '3px solid #F57F17', 
                                  fontSize: '12px', 
                                  color: '#F57F17',
                                  borderRadius: '0 4px 4px 0',
                                  fontWeight: 500
                                }}>
                                  {t('tasks.moderation_pending_desc')}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '18px', color: 'var(--color-secondary)' }}>
                                  {task.budget ? formatCurrency(task.budget) : 'Open Budget'}
                                </div>
                                {task.offersCount > 0 ? (
                                  <div style={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(255, 215, 0, 0.12)', 
                                    color: 'var(--color-secondary)', 
                                    padding: '4px 8px', 
                                    borderRadius: 'var(--radius)', 
                                    fontSize: '11px', 
                                    fontWeight: 600,
                                    marginTop: '4px',
                                    border: '1px solid rgba(230, 194, 0, 0.3)'
                                  }}>
                                    <span style={{ 
                                      width: '6px', 
                                      height: '6px', 
                                      borderRadius: '50%', 
                                      background: 'var(--color-primary-container)', 
                                      display: 'inline-block' 
                                    }} />
                                    <span>{task.offersCount} Offer{task.offersCount !== 1 ? 's' : ''} to review</span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginTop: '4px' }}>
                                    No offers yet
                                  </div>
                                )}
                              </div>
                              <ArrowRight size={20} style={{ color: 'var(--color-on-surface-variant)' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state">
                    <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No active task ads</h3>
                    <p style={{ marginBottom: 'var(--space-4)' }}>Post a task description to receive offers from taskers.</p>
                    <Link to="/tasks/new">
                      <button className="btn btn-primary"><Plus size={16} /> Post a Task</button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Booked Tasks */}
            {bookedTasks.length > 0 && (
              <div>
                <div className="section-label">Booked / In Progress ({bookedTasks.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {bookedTasks.map((task) => (
                    <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card card-hover">
                        <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                                <span className="section-label" style={{ margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{CATEGORY_ICONS[task.category]}</span> {task.category}
                                </span>
                                <StatusBadge status={task.status} />
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-secondary)' }}>{task.title}</div>
                              <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                                Assigned to provider · Scheduled: {formatDate(task.date)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '18px', color: 'var(--color-secondary)' }}>
                                  {task.budget ? formatCurrency(task.budget) : 'Open Budget'}
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-status-success)', textTransform: 'uppercase', marginTop: '4px' }}>
                                  Booked Price
                                </div>
                              </div>
                              <ArrowRight size={20} style={{ color: 'var(--color-on-surface-variant)' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Completed client tasks - Transaction List Spec */}
            {completedTasks.length > 0 && (
              <div>
                <div className="section-label">Completed Task History ({completedTasks.length})</div>
                <div className="transaction-rows-container">
                  <div className="transaction-row-header">
                    <span>Task Activity</span>
                    <span style={{ gridColumn: 'span 2' }}></span>
                    <span style={{ textAlign: 'right', paddingRight: '16px' }}>Budget</span>
                    <span style={{ textAlign: 'center' }}>Status</span>
                  </div>
                  {completedTasks.map((task) => {
                    const categoryIcon = CATEGORY_ICONS[task.category] || '📋';
                    return (
                      <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="transaction-row-item">
                          <div>
                            <div className="transaction-initials-badge" style={{ fontSize: '18px' }}>{categoryIcon}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{task.title}</span>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                              Category: {task.category}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                              Completed {formatDate(task.date)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '16px' }}>
                            <span className="transaction-amount-red">
                              {task.budget ? `- ${formatCurrency(task.budget)}` : 'Open'}
                            </span>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                              {task.budgetType === 'fixed' ? 'Fixed price' : task.budgetType === 'hourly' ? 'Hourly rate' : 'Open budget'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <StatusBadge status={task.status} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : dbUser?.coTaskerStatus !== 'approved' ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                {dbUser?.coTaskerStatus === 'pending' ? (
                  <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                    <h2 className="text-headline-sm" style={{ fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '8px' }}>
                      {t('tasks.application_pending_title') || 'Application Pending Review'}
                    </h2>
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', lineHeight: '1.6', margin: 0 }}>
                      {t('tasks.application_pending_desc') || 'Your application to become a registered Co-Tasker is currently under review by our moderation team. You will receive a notification as soon as your profile is approved.'}
                    </p>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-4)' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--color-primary-container)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-secondary)', fontWeight: 'bold'
                      }}>
                        💼
                      </div>
                      <h2 className="text-headline-sm" style={{ margin: 0, fontWeight: 700, color: 'var(--color-secondary)', fontSize: '18px' }}>
                        {t('tasks.apply_title') || 'Apply to Become a Co-Tasker'}
                      </h2>
                    </div>
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', lineHeight: '1.6', marginBottom: 'var(--space-5)' }}>
                      {t('tasks.apply_desc') || 'Unlock the ability to bid on tasks, browse One Tap, Task Done, and earn money. Fill out the quick details below for moderator approval.'}
                    </p>
                    <form onSubmit={handleApply} className="flex flex-col gap-4">
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label required" style={{ fontWeight: 600 }}>
                          {t('tasks.apply_bio') || 'Introduce Yourself (Bio)'}
                        </label>
                        <textarea
                          className="form-textarea"
                          rows={4}
                          required
                          placeholder={t('tasks.apply_bio_placeholder') || 'Describe your skills, experience, and the services you can offer...'}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid var(--color-outline-variant)',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--text-body-sm)',
                            outline: 'none',
                            background: 'transparent',
                            color: 'var(--color-on-surface)',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>
                          {t('tasks.apply_skills') || 'Your Skills'}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={t('tasks.apply_skills_placeholder') || 'e.g. Cleaning, Painting, Furniture Assembly (comma separated)'}
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 0',
                            border: 'none',
                            borderBottom: '1.5px solid var(--color-outline-variant)',
                            borderRadius: 0,
                            fontSize: 'var(--text-body-sm)',
                            outline: 'none',
                            background: 'transparent',
                            color: 'var(--color-on-surface)'
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label className="form-label required" style={{ fontWeight: 600 }}>
                          {t('tasks.apply_rate') || 'Desired Hourly Rate (€/hour)'}
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          required
                          min={10}
                          value={rate}
                          onChange={(e) => setRate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 0',
                            border: 'none',
                            borderBottom: '1.5px solid var(--color-outline-variant)',
                            borderRadius: 0,
                            fontSize: 'var(--text-body-sm)',
                            outline: 'none',
                            background: 'transparent',
                            color: 'var(--color-on-surface)'
                          }}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '12px', width: '100%', height: '42px', borderRadius: 'var(--radius)', fontWeight: 700 }}>
                        {isSubmitting ? (t('tasks.apply_submitting') || 'Submitting...') : (t('tasks.apply_submit_btn') || 'Submit Application')}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Active Jobs */}
            <div>
              <div className="section-label">Active Jobs ({activeJobs.length})</div>
              {activeJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {activeJobs.map((task) => {
                    const acceptedOffer = state.offers.find(
                      (o) => o.taskId === task.id && o.coTaskerId === currentUser?.id && o.status === 'accepted'
                    );
                    return (
                      <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none' }}>
                        <div className="card card-hover">
                          <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  <span className="section-label" style={{ margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{CATEGORY_ICONS[task.category]}</span> {task.category}
                                  </span>
                                  <StatusBadge status={task.status} />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-secondary)' }}>{task.title}</div>
                                <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                                  Location: {task.location} · Due Date: {formatDate(task.date)}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                {acceptedOffer && (
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '18px', color: 'var(--color-secondary)' }}>
                                      {formatCurrency(acceptedOffer.price)}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase' }}>
                                      Agreed price
                                    </div>
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
                  <div className="empty-state">
                    <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No active assigned jobs</h3>
                    <p style={{ marginBottom: 'var(--space-4)' }}>Browse tasks posted by others and make an offer to start earning.</p>
                    <Link to="/browse">
                      <button className="btn btn-primary">Browse Tasks</button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* My Offers */}
            <div>
              <div className="section-label">My Offers / Bids ({myOffers.length})</div>
              {myOffers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {myOffers.map((offer) => {
                    const task = state.tasks.find((t) => t.id === offer.taskId);
                    if (!task) return null;
                    return (
                      <div key={offer.id} className="card">
                        <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span className="section-label" style={{ margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{CATEGORY_ICONS[task.category]}</span> {task.category}
                                </span>
                                <StatusBadge status={offer.status} />
                              </div>
                              <Link to={`/tasks/${task.id}`} style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-secondary)', textDecoration: 'none', display: 'block' }}>
                                {task.title}
                              </Link>
                              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', margin: '6px 0 0 0', fontStyle: 'italic' }}>
                                "{offer.message}"
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '18px', color: 'var(--color-secondary)' }}>
                                {formatCurrency(offer.price)}
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginTop: '2px' }}>
                                Effort: ~{offer.estimatedHours}h
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-3)' }}>
                            <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>
                              SUBMITTED {formatRelativeTime(offer.createdAt)}
                            </span>
                            <Link to={`/tasks/${task.id}`}>
                              <button className="btn btn-outlined btn-sm">View Task Details</button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state">
                    <p>You haven't submitted any offers yet.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Jobs - Transaction List Spec */}
            {completedJobs.length > 0 && (
              <div>
                <div className="section-label">Completed Jobs History ({completedJobs.length})</div>
                <div className="transaction-rows-container">
                  <div className="transaction-row-header">
                    <span>Job / Project Activity</span>
                    <span style={{ gridColumn: 'span 2' }}></span>
                    <span style={{ textAlign: 'right', paddingRight: '16px' }}>Earnings</span>
                    <span style={{ textAlign: 'center' }}>Status</span>
                  </div>
                  {completedJobs.map((task) => {
                    const tx = state.walletTransactions.find(
                      (w) => w.taskId === task.id && w.coTaskerId === currentUser?.id
                    );
                    const categoryIcon = CATEGORY_ICONS[task.category] || '📋';
                    return (
                      <Link key={task.id} to={`/tasks/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="transaction-row-item">
                          <div>
                            <div className="transaction-initials-badge" style={{ fontSize: '18px' }}>{categoryIcon}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{task.title}</span>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                              Category: {task.category}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                              Completed {formatDate(task.date)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '16px' }}>
                            <span className="transaction-amount-green">
                              {tx ? `+ ${formatCurrency(tx.amount)}` : '—'}
                            </span>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                              {tx ? 'Released' : 'Processing'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <StatusBadge status={task.status} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
