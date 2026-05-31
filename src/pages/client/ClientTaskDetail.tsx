import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckCircle, X, Star, Wallet, User } from 'lucide-react';
import posthog from '../../utils/posthogClient';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, acceptOfferAction, updateTaskStatusAction, addReviewAction, addNotificationAction, createConversationAction, sendChatMessageAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { OfferCard } from '../../components/offers/OfferCard';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { profileService } from '../../services/profileService';
import { formatDate, formatCurrency, generateId } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';
import type { Offer, User as UserType, Review } from '../../types';
import { CoTaskerProfileDrawer } from '../../components/profile/CoTaskerProfileDrawer';

export function ClientTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const task = state.tasks.find((t) => t.id === id);
  const offers = state.offers.filter((o) => o.taskId === id);
  const acceptedOffer = offers.find((o) => o.status === 'accepted');

  const [assignedUser, setAssignedUser] = useState<UserType | null>(null);
  const [acceptConfirm, setAcceptConfirm] = useState<Offer | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [completeConfirm, setCompleteConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedTaskerId, setSelectedTaskerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'offers' | 'review'>('details');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState(0);
  const [editDate, setEditDate] = useState('');

  const existingReview = state.reviews.find(
    (r) => r.taskId === id && r.fromUserId === currentUser?.id
  );

  useEffect(() => {
    if (task?.assignedCoTaskerId) {
      profileService.getUserById(task.assignedCoTaskerId).then(setAssignedUser);
    }
  }, [task?.assignedCoTaskerId]);



  if (!task) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>Task not found</h3>
        <Link to="/my-tasks"><button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Tasks</button></Link>
      </div>
    );
  }

  if (task.clientId !== currentUser?.id && currentUser?.role !== 'admin') {
    return <div className="empty-state"><h3>Access denied</h3></div>;
  }

  const handleMessageTasker = (coTaskerId: string) => {
    const existingConv = state.conversations.find(
      (c) => c.taskId === task.id && c.participantIds.includes(coTaskerId)
    );
    
    if (existingConv) {
      navigate(`/messages?conv=${existingConv.id}`);
    } else {
      const convId = generateId('conv');
      const newConversation = {
        id: convId,
        participantIds: [currentUser!.id, coTaskerId],
        lastMessage: `Hi! Let's chat about my task "${task.title}".`,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        taskId: task.id
      };
      dispatch(createConversationAction(newConversation));
      
      const newMessage = {
        id: generateId('msg'),
        conversationId: convId,
        senderId: currentUser!.id,
        text: `Hi! Let's chat about my task "${task.title}".`,
        createdAt: new Date().toISOString()
      };
      dispatch(sendChatMessageAction(newMessage));

      navigate(`/messages?conv=${convId}`);
    }
  };

  const handleAcceptOffer = async () => {
    if (!acceptConfirm) return;
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    dispatch(acceptOfferAction(acceptConfirm.id, task.id, acceptConfirm.coTaskerId));
    posthog.capture('offer_accepted', {
      offer_id: acceptConfirm.id,
      task_id: task.id,
      category: task.category,
      offer_price: acceptConfirm.price,
    });
    dispatch(addNotificationAction({
      id: generateId('notif'),
      userId: acceptConfirm.coTaskerId,
      type: 'offer_accepted',
      title: 'Your offer was accepted!',
      message: `Your offer for "${task.title}" has been accepted. Check your jobs to get started.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkTo: '/my-tasks?tab=tasker',
    }));
    showToast('Offer accepted! The task has been assigned.', 'success');
    setAcceptConfirm(null);
    setIsActionLoading(false);
  };

  const handleCancelTask = async () => {
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch({ type: 'CANCEL_TASK', payload: { taskId: task.id } });
    posthog.capture('task_cancelled', {
      task_id: task.id,
      category: task.category,
      status_at_cancel: task.status,
    });
    showToast('Task has been cancelled.', 'info');
    setCancelConfirm(false);
    setIsActionLoading(false);
    navigate('/my-tasks');
  };

  const handleMarkComplete = async () => {
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    dispatch(updateTaskStatusAction(task.id, 'completed'));
    posthog.capture('task_completed', {
      task_id: task.id,
      category: task.category,
      accepted_offer_price: acceptedOffer?.price,
    });
    showToast('Task marked as complete!', 'success');
    setCompleteConfirm(false);
    setIsActionLoading(false);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewComment.trim() || reviewComment.length < 10) {
      showToast('Please write at least 10 characters for your review.', 'warning');
      return;
    }
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const review: Review = {
      id: generateId('review'),
      taskId: task.id,
      fromUserId: currentUser!.id,
      toUserId: task.assignedCoTaskerId!,
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
    };
    dispatch(addReviewAction(review));
    posthog.capture('review_submitted', {
      review_id: review.id,
      task_id: task.id,
      category: task.category,
      rating: reviewRating,
    });
    showToast('Review submitted! Thank you.', 'success');
    setShowReviewModal(false);
    setIsActionLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        budget: editBudget,
        date: editDate,
        moderationStatus: 'pending'
      }
    });
    showToast('Task updated successfully! It has been submitted for moderation review.', 'success');
    setShowEditModal(false);
    setIsActionLoading(false);
  };

  const canCancel = task.status === 'open' || task.status === 'receiving_offers';
  const canComplete = task.status === 'assigned' || task.status === 'in_progress';
  const emoji = CATEGORY_ICONS[task.category] ?? '📋';

  return (
    <div>
      {/* Header */}
      <div className="page-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="section-label" style={{ margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{emoji}</span> {task.category}
              </span>
              <StatusBadge status={task.status} />
              {task.taskType === 'remote' ? (
                <span className="badge badge-secondary" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>💻 Remote</span>
              ) : (
                <span className="badge badge-secondary" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>📍 In Person</span>
              )}
            </div>
            <h1 className="text-headline-md truncate" style={{ margin: 0, fontWeight: 700 }}>{task.title}</h1>
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          {canCancel && (
            <>
              <button className="btn btn-outlined btn-sm" onClick={() => {
                setEditTitle(task.title);
                setEditDescription(task.description);
                setEditBudget(task.budget || 0);
                setEditDate(task.date);
                setShowEditModal(true);
              }} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
                Edit Task
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setCancelConfirm(true)}>
                <X size={14} /> Cancel Task
              </button>
            </>
          )}
          {canComplete && (
            <button className="btn btn-primary btn-sm" onClick={() => setCompleteConfirm(true)}>
              <CheckCircle size={14} /> Mark Complete
            </button>
          )}
        </div>
      </div>

      <div className="page-inner">
        <div className="bento-grid">
          {/* Main Column */}
          <div className="bento-col-8 flex flex-col gap-4">
            {/* Tab Navigation Header */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--color-outline-variant)',
              marginBottom: 'var(--space-2)',
              gap: 'var(--space-2)',
              background: 'var(--color-surface-container-lowest)',
              padding: '0 var(--space-4)',
              borderRadius: 'var(--radius)'
            }}>
              <button
                onClick={() => setActiveTab('details')}
                style={{
                  padding: '14px var(--space-4)',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'details' ? '3px solid var(--color-primary)' : '3px solid transparent',
                  color: activeTab === 'details' ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
                  fontWeight: 600,
                  fontSize: 'var(--text-body-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Task Details
              </button>
              {task.status !== 'cancelled' && (
                <button
                  onClick={() => setActiveTab('offers')}
                  style={{
                    padding: '14px var(--space-4)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'offers' ? '3px solid var(--color-primary)' : '3px solid transparent',
                    color: activeTab === 'offers' ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
                    fontWeight: 600,
                    fontSize: 'var(--text-body-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Offers Received
                  <span style={{
                    background: activeTab === 'offers' ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                    color: activeTab === 'offers' ? 'var(--color-on-primary)' : 'var(--color-secondary)',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {offers.filter(o => o.status !== 'withdrawn').length}
                  </span>
                </button>
              )}
              {task.status === 'completed' && task.assignedCoTaskerId && (
                <button
                  onClick={() => setActiveTab('review')}
                  style={{
                    padding: '14px var(--space-4)',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'review' ? '3px solid var(--color-primary)' : '3px solid transparent',
                    color: activeTab === 'review' ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
                    fontWeight: 600,
                    fontSize: 'var(--text-body-sm)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Your Review
                </button>
              )}
            </div>

            {/* Tab content 1: Details */}
            {activeTab === 'details' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700 }}>Task Details</h2>
                </div>
                <div className="card-body">
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--lh-body-lg)', color: 'var(--color-on-surface-variant)', margin: 0 }}>
                    {task.description}
                  </p>

                  {task.mustHaves && task.mustHaves.length > 0 && (
                    <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)' }}>
                      <div className="section-label" style={{ fontSize: '11px', marginBottom: '12px' }}>Must-Haves & Requirements</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {task.mustHaves.map((m, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: '10px var(--space-4)',
                            background: 'var(--color-surface-container-low)',
                            border: '1px solid var(--color-outline-variant)',
                            borderRadius: 'var(--radius)',
                          }}>
                            <div className="transaction-initials-badge" style={{ width: '24px', height: '24px', fontSize: '10px', flexShrink: 0, background: 'var(--color-primary-container)', borderColor: 'var(--color-outline-variant)', color: 'var(--color-secondary)' }}>
                              ✓
                            </div>
                            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)', fontWeight: 500 }}>
                              {m}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.images && task.images.length > 0 && (
                    <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)' }}>
                      <div className="section-label" style={{ fontSize: '11px', marginBottom: '8px' }}>Reference Images</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {task.images.map((img, i) => (
                          <div key={i} style={{ borderRadius: 'var(--radius)', overflow: 'hidden', width: '180px', height: '120px', border: '1px solid var(--color-outline-variant)' }}>
                            <img src={img} alt={`Reference ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)' }}>
                    <div>
                      <div className="section-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Location</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-body-sm)' }}>
                        <MapPin size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                        <span>{task.location} · {task.address}</span>
                      </div>
                    </div>
                    <div>
                      <div className="section-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Schedule</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-body-sm)' }}>
                        <Calendar size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                        <span>
                          {formatDate(task.date)} {task.time && `at ${task.time}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 2: Offers */}
            {activeTab === 'offers' && task.status !== 'cancelled' && (
              <div className="card">
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-outline-variant)', padding: 'var(--space-4) var(--space-5)' }}>
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    Offers Received ({offers.filter(o => o.status !== 'withdrawn').length})
                  </h2>
                </div>
                <div className="card-body" style={{ padding: offers.length > 0 ? 0 : 'var(--space-6)' }}>
                  {offers.length > 0 ? (
                    <div className="transaction-rows-container" style={{ border: 'none', borderRadius: 0 }}>
                      {offers.map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          onAccept={task.status === 'receiving_offers' ? (id) => {
                            const o = offers.find(x => x.id === id);
                            if (o) setAcceptConfirm(o);
                          } : undefined}
                          onMessage={handleMessageTasker}
                          onViewProfile={setSelectedTaskerId}
                          viewerRole="client"
                          showActions={task.status === 'receiving_offers'}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
                      <div className="empty-state-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                      <h3 className="text-headline-sm" style={{ marginBottom: '4px', fontSize: '15px', fontWeight: 700 }}>No offers received yet</h3>
                      <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', margin: 0 }}>
                        Providers will start submitting bids shortly. We will notify you when a new offer is made.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab content 3: Review */}
            {activeTab === 'review' && task.status === 'completed' && task.assignedCoTaskerId && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700 }}>Your Review</h2>
                </div>
                <div className="card-body">
                  {existingReview ? (
                    <div>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: 'var(--space-3)' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} className={`star ${s <= existingReview.rating ? '' : 'star-empty'}`}>★</span>
                        ))}
                      </div>
                      <p style={{ color: 'var(--color-on-surface-variant)', fontStyle: 'italic', margin: 0 }}>
                        "{existingReview.comment}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <p style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                        How was your experience with the service provider? Let others know!
                      </p>
                      <button className="btn btn-primary" onClick={() => setShowReviewModal(true)} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Star size={16} /> Leave a Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="bento-col-4 flex flex-col gap-6">
            {/* GiroKonto styled Budget Card */}
            <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-container-low)',
                  border: '1.5px solid var(--color-outline-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-secondary)'
                }}>
                  <Wallet size={18} />
                </div>
                <span className="text-label" style={{ fontSize: '9px', color: 'var(--color-on-surface-variant)' }}>Contract Spec</span>
              </div>
              <div>
                <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Task Budget</div>
                {task.budgetType === 'fixed' && task.budget ? (
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                    {formatCurrency(task.budget)}
                  </div>
                ) : task.budgetType === 'hourly' && task.budget ? (
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                    {formatCurrency(task.budget)}/hr
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '24px', fontWeight: 700, color: 'var(--color-secondary-mid)', lineHeight: 1.1 }}>
                    Open to offers
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px', marginTop: '12px', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                {task.budgetType === 'fixed' ? 'Fixed price contract' : task.budgetType === 'hourly' ? 'Hourly rates contract' : 'Open bidding'}
              </div>
            </div>


            {/* Payment Info */}
            {acceptedOffer && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wallet size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                    Payment Details
                  </h3>
                </div>
                <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                  {state.walletTransactions.filter(w => w.taskId === task.id).map(tx => (
                    <div key={tx.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-body-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)' }}>Funded Amount</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)' }}>Contract Status</span>
                        <span className={`badge badge-${tx.status}`}>
                          {tx.status === 'reserved' ? 'In Escrow' : tx.status === 'released' ? 'Released' : 'Refunded'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {state.walletTransactions.filter(w => w.taskId === task.id).length === 0 && (
                    <div style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', textAlign: 'center' }}>
                      No transactions recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assigned Provider Profile */}
            {assignedUser && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                    Assigned Provider
                  </h3>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Avatar name={assignedUser.name} avatarUrl={assignedUser.avatarUrl} size="lg" />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{assignedUser.name}</div>
                      <Link to={`/profile/${assignedUser.id}`} style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)', fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                        View Profile →
                      </Link>
                    </div>
                  </div>
                  {acceptedOffer && (
                    <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', fontSize: 'var(--text-body-sm)', border: '1px solid var(--color-outline-variant)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)' }}>Agreed budget:</span>
                        <strong>{formatCurrency(acceptedOffer.price)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)' }}>Estimated effort:</span>
                        <strong>~{acceptedOffer.estimatedHours} hours</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!acceptConfirm}
        onClose={() => setAcceptConfirm(null)}
        onConfirm={handleAcceptOffer}
        title="Accept this offer?"
        message={`You are about to accept the offer of ${acceptConfirm?.price ? formatCurrency(acceptConfirm.price) : ''}. All other offers will be auto-declined and the project funds will be placed in secure escrow.`}
        confirmLabel="Accept Offer"
        isLoading={isActionLoading}
      />
      <ConfirmModal
        isOpen={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={handleCancelTask}
        title="Cancel task listing?"
        message="This will cancel your task posting, delete the listing from the marketplace, and close all pending offers. This action cannot be undone."
        confirmLabel="Cancel Listing"
        confirmVariant="danger"
        isLoading={isActionLoading}
      />
      <ConfirmModal
        isOpen={completeConfirm}
        onClose={() => setCompleteConfirm(false)}
        onConfirm={handleMarkComplete}
        title="Mark task as completed?"
        message="Please verify that the work has been completed to your satisfaction. Confirming completion will release the escrow funds directly to the provider."
        confirmLabel="Confirm Completion"
        isLoading={isActionLoading}
      />

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Service Provider"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowReviewModal(false)}>Skip</button>
            <button className="btn btn-primary" onClick={handleSubmitReview} disabled={isActionLoading}>
              {isActionLoading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              Submit Review
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>How was your experience?</div>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  style={{ fontSize: '32px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-primary-container)' }}
                >
                  {s <= reviewRating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label required">Written Feedback</label>
            <textarea
              className="form-textarea"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Tell others what it was like working with this provider. Minimum 10 characters."
              rows={4}
              required
            />
          </div>
        </div>
      </Modal>

      {/* Profile & Reviews Drawer */}
      <CoTaskerProfileDrawer 
        userId={selectedTaskerId}
        onClose={() => setSelectedTaskerId(null)}
      />

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task Details"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={isActionLoading}>
              {isActionLoading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              Save Changes
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label required">Task Title</label>
            <input
              type="text"
              className="form-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Clean my 2-bedroom apartment"
              required
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
          <div className="form-group">
            <label className="form-label required">Description</label>
            <textarea
              className="form-textarea"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Provide a detailed description of the task..."
              rows={5}
              required
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
          <div className="form-group">
            <label className="form-label">Task Date</label>
            <input
              type="date"
              className="form-input"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
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
          {task.budgetType !== 'open_to_offers' && (
            <div className="form-group">
              <label className="form-label required">Budget (€)</label>
              <input
                type="number"
                className="form-input"
                value={editBudget}
                onChange={(e) => setEditBudget(Number(e.target.value))}
                min={5}
                required
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
          )}
        </div>
      </Modal>
    </div>
  );
}
