import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, CheckCircle, X, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, acceptOfferAction, updateTaskStatusAction, addReviewAction, addNotificationAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { OfferCard } from '../../components/offers/OfferCard';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { profileService } from '../../services/profileService';
import { formatDate, formatCurrency, generateId } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';
import type { Offer, User, Review } from '../../types';

export function ClientTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const task = state.tasks.find((t) => t.id === id);
  const offers = state.offers.filter((o) => o.taskId === id);
  const acceptedOffer = offers.find((o) => o.status === 'accepted');

  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [acceptConfirm, setAcceptConfirm] = useState<Offer | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [completeConfirm, setCompleteConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

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
        <Link to="/client/tasks"><button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Tasks</button></Link>
      </div>
    );
  }

  if (task.clientId !== currentUser?.id && currentUser?.role !== 'admin') {
    return <div className="empty-state"><h3>Access denied</h3></div>;
  }

  const handleAcceptOffer = async () => {
    if (!acceptConfirm) return;
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    dispatch(acceptOfferAction(acceptConfirm.id, task.id, acceptConfirm.coTaskerId));
    dispatch(addNotificationAction({
      id: generateId('notif'),
      userId: acceptConfirm.coTaskerId,
      type: 'offer_accepted',
      title: 'Your offer was accepted!',
      message: `Your offer for "${task.title}" has been accepted. Check your jobs to get started.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkTo: '/cotasker/jobs',
    }));
    showToast('Offer accepted! The task has been assigned.', 'success');
    setAcceptConfirm(null);
    setIsActionLoading(false);
  };

  const handleCancelTask = async () => {
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch({ type: 'CANCEL_TASK', payload: { taskId: task.id } });
    showToast('Task has been cancelled.', 'info');
    setCancelConfirm(false);
    setIsActionLoading(false);
    navigate('/client/tasks');
  };

  const handleMarkComplete = async () => {
    setIsActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    dispatch(updateTaskStatusAction(task.id, 'completed'));
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
    showToast('Review submitted! Thank you.', 'success');
    setShowReviewModal(false);
    setIsActionLoading(false);
  };

  const canCancel = task.status === 'open' || task.status === 'receiving_offers';
  const canComplete = task.status === 'assigned' || task.status === 'in_progress';
  const emoji = CATEGORY_ICONS[task.category] ?? '📋';

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon" style={{ marginTop: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span>{emoji}</span>
            <StatusBadge status={task.status} showDot />
          </div>
          <h1 className="text-headline-lg" style={{ marginBottom: 'var(--space-1)' }}>{task.title}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} />{task.location} · {task.address}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} />{formatDate(task.date)}</span>
            {task.time && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} />{task.time}</span>}
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          {canCancel && (
            <button className="btn btn-danger btn-sm" onClick={() => setCancelConfirm(true)}>
              <X size={14} /> Cancel Task
            </button>
          )}
          {canComplete && (
            <button className="btn btn-primary btn-sm" onClick={() => setCompleteConfirm(true)}>
              <CheckCircle size={14} /> Mark Complete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-5)' }} className="task-detail-grid">
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Description */}
          <div className="card">
            <div className="card-header"><h2 className="text-headline-sm">Description</h2></div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--lh-body-lg)', color: 'var(--color-on-surface-variant)' }}>{task.description}</p>
            </div>
          </div>

          {/* Offers Section */}
          {task.status !== 'cancelled' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <h2 className="text-headline-sm">Offers</h2>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                  <Users size={14} /> {offers.filter(o => o.status !== 'withdrawn').length} received
                </span>
              </div>
              {offers.length > 0 ? (
                offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={task.status === 'receiving_offers' ? (id) => {
                      const o = offers.find(x => x.id === id);
                      if (o) setAcceptConfirm(o);
                    } : undefined}
                    viewerRole="client"
                    showActions={task.status === 'receiving_offers'}
                  />
                ))
              ) : (
                <div className="card">
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <div className="empty-state-icon"><Users size={40} /></div>
                    <h3 className="text-headline-sm">No offers yet</h3>
                    <p>Providers will start submitting offers soon.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review section */}
          {task.status === 'completed' && task.assignedCoTaskerId && (
            <div className="card">
              <div className="card-header"><h2 className="text-headline-sm">Your Review</h2></div>
              <div className="card-body">
                {existingReview ? (
                  <div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize: '20px' }}>{s <= existingReview.rating ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                    <p style={{ color: 'var(--color-on-surface-variant)' }}>{existingReview.comment}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p style={{ color: 'var(--color-on-surface-variant)' }}>How did this task go?</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowReviewModal(true)} style={{ width: 'fit-content' }}>
                      <Star size={14} /> Leave a Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Budget Card */}
          <div className="card">
            <div className="card-body">
              <div className="stat-label" style={{ marginBottom: 'var(--space-2)' }}>Budget</div>
              {task.budgetType === 'fixed' && task.budget ? (
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                  {formatCurrency(task.budget)}
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', fontWeight: 600, color: 'var(--color-tertiary)' }}>
                  Open to offers
                </div>
              )}
              <div className="stat-label" style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>Category</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-body-md)' }}>{emoji} {task.category}</div>
            </div>
          </div>

          {/* Payment status */}
          {acceptedOffer && (
            <div className="card">
              <div className="card-header"><h2 className="text-headline-sm">Payment</h2></div>
              <div className="card-body">
                {state.walletTransactions.filter(w => w.taskId === task.id).map(tx => (
                  <div key={tx.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>Amount</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>Status</span>
                      <span className={`badge badge-${tx.status}`}>{tx.status}</span>
                    </div>
                  </div>
                ))}
                {state.walletTransactions.filter(w => w.taskId === task.id).length === 0 && (
                  <div style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)' }}>Payment will be reserved when you accept an offer</div>
                )}
              </div>
            </div>
          )}

          {/* Assigned Provider */}
          {assignedUser && (
            <div className="card">
              <div className="card-header"><h2 className="text-headline-sm">Assigned Provider</h2></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Avatar name={assignedUser.name} avatarUrl={assignedUser.avatarUrl} size="lg" />
                  <div>
                    <div style={{ fontWeight: 700 }}>{assignedUser.name}</div>
                    <Link to={`/profile/${assignedUser.id}`} style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                      View Profile →
                    </Link>
                  </div>
                </div>
                {acceptedOffer && (
                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', fontSize: 'var(--text-body-sm)' }}>
                    <strong>Agreed price:</strong> {formatCurrency(acceptedOffer.price)}
                    <br />
                    <strong>Est. time:</strong> ~{acceptedOffer.estimatedHours}h
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!acceptConfirm}
        onClose={() => setAcceptConfirm(null)}
        onConfirm={handleAcceptOffer}
        title="Accept this offer?"
        message={`You're about to accept ${acceptConfirm?.price ? formatCurrency(acceptConfirm.price) : ''} offer. All other offers will be rejected and the task will be assigned. This action cannot be undone.`}
        confirmLabel="Accept Offer"
        isLoading={isActionLoading}
      />
      <ConfirmModal
        isOpen={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        onConfirm={handleCancelTask}
        title="Cancel this task?"
        message="This will permanently cancel the task and reject all pending offers. This cannot be undone."
        confirmLabel="Cancel Task"
        confirmVariant="danger"
        isLoading={isActionLoading}
      />
      <ConfirmModal
        isOpen={completeConfirm}
        onClose={() => setCompleteConfirm(false)}
        onConfirm={handleMarkComplete}
        title="Mark task as complete?"
        message="Confirming completion will release the payment to the provider. Please only confirm once the work has been done to your satisfaction."
        confirmLabel="Mark Complete"
        isLoading={isActionLoading}
      />

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Leave a Review"
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
            <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Rating</div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {s <= reviewRating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Your comment</label>
            <textarea
              className="form-textarea"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How did the task go? Was the provider professional and thorough?"
              rows={4}
            />
          </div>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 767px) {
          .task-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
