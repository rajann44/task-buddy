import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, createOfferAction, withdrawOfferAction, updateTaskStatusAction, addNotificationAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { OfferForm } from '../../components/offers/OfferForm';
import { ConfirmModal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { profileService } from '../../services/profileService';
import { formatDate, formatCurrency, generateId } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';
import type { Offer, User as UserType } from '../../types';

export function CoTaskerTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const task = state.tasks.find((t) => t.id === id);
  const myOffer = state.offers.find(
    (o) => o.taskId === id && o.coTaskerId === currentUser?.id && o.status !== 'withdrawn'
  );
  const allOffers = state.offers.filter((o) => o.taskId === id);

  const [clientUser, setClientUser] = useState<UserType | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [updateStatusConfirm, setUpdateStatusConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task?.clientId) profileService.getUserById(task.clientId).then(setClientUser);
  }, [task?.clientId]);

  if (!task) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>Task not found</h3>
        <Link to="/cotasker/tasks"><button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Browse</button></Link>
      </div>
    );
  }

  const canOffer = (task.status === 'open' || task.status === 'receiving_offers') && !myOffer;
  const isAssignedToMe = task.assignedCoTaskerId === currentUser?.id;
  const emoji = CATEGORY_ICONS[task.category] ?? '📋';

  const handleSubmitOffer = async (data: { price: number; message: string; estimatedHours: number }) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const newOffer: Offer = {
      id: generateId('offer'),
      taskId: task.id,
      coTaskerId: currentUser!.id,
      price: data.price,
      message: data.message,
      estimatedHours: data.estimatedHours,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    dispatch(createOfferAction(newOffer));
    dispatch(addNotificationAction({
      id: generateId('notif'),
      userId: task.clientId,
      type: 'new_offer',
      title: 'New offer received',
      message: `${currentUser!.name} sent an offer of ${formatCurrency(data.price)} for your task "${task.title}".`,
      isRead: false,
      createdAt: new Date().toISOString(),
      linkTo: `/client/tasks/${task.id}`,
    }));
    showToast('Offer sent successfully!', 'success');
    setShowOfferForm(false);
    setIsLoading(false);
  };

  const handleWithdraw = async () => {
    if (!myOffer) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch(withdrawOfferAction(myOffer.id));
    showToast('Offer withdrawn.', 'info');
    setWithdrawConfirm(false);
    setIsLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!updateStatusConfirm) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch(updateTaskStatusAction(task.id, updateStatusConfirm as any));
    showToast(`Task status updated to "${updateStatusConfirm}".`, 'success');
    setUpdateStatusConfirm(null);
    setIsLoading(false);
  };

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
            {isAssignedToMe && <span className="badge badge-assigned">Your Job</span>}
          </div>
          <h1 className="text-headline-lg">{task.title}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} />{task.location} · {task.address}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={13} />{formatDate(task.date)}</span>
            {task.time && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} />{task.time}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-5)' }} className="ct-task-grid">
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Description */}
          <div className="card">
            <div className="card-header"><h2 className="text-headline-sm">Task Description</h2></div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--lh-body-lg)', color: 'var(--color-on-surface-variant)' }}>{task.description}</p>
            </div>
          </div>

          {/* My Offer / Offer Form */}
          {myOffer ? (
            <div className="card">
              <div className="card-header">
                <h2 className="text-headline-sm">Your Offer</h2>
                <StatusBadge status={myOffer.status} />
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <div className="stat-label">Your Price</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontSize: '24px', fontWeight: 700 }}>{formatCurrency(myOffer.price)}</div>
                  </div>
                  <div>
                    <div className="stat-label">Est. Time</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontSize: '24px', fontWeight: 700 }}>{myOffer.estimatedHours}h</div>
                  </div>
                </div>
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', fontStyle: 'italic', marginBottom: 'var(--space-4)' }}>
                  "{myOffer.message}"
                </div>
                {myOffer.status === 'pending' && (
                  <button className="btn btn-danger btn-sm" onClick={() => setWithdrawConfirm(true)}>
                    Withdraw Offer
                  </button>
                )}
              </div>
            </div>
          ) : canOffer ? (
            <div className="card">
              <div className="card-header"><h2 className="text-headline-sm">Send an Offer</h2></div>
              <div className="card-body">
                {showOfferForm ? (
                  <OfferForm
                    taskId={task.id}
                    coTaskerId={currentUser!.id}
                    onSubmit={handleSubmitOffer}
                    onCancel={() => setShowOfferForm(false)}
                    isLoading={isLoading}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                    <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-4)' }}>
                      Interested in this task? Send your offer with your price and availability.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowOfferForm(true)}>
                      <DollarSign size={16} /> Make an Offer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Status update for assigned tasks */}
          {isAssignedToMe && (task.status === 'assigned' || task.status === 'in_progress') && (
            <div className="card">
              <div className="card-header"><h2 className="text-headline-sm">Update Job Status</h2></div>
              <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {task.status === 'assigned' && (
                  <button className="btn btn-secondary" onClick={() => setUpdateStatusConfirm('in_progress')}>
                    Mark as In Progress
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)' }}>
                    Waiting for the client to mark this task as complete.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Budget */}
          <div className="card">
            <div className="card-body">
              <div className="stat-label" style={{ marginBottom: 'var(--space-2)' }}>Budget</div>
              {task.budgetType === 'fixed' && task.budget ? (
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700 }}>{formatCurrency(task.budget)}</div>
              ) : (
                <div style={{ fontFamily: 'var(--font-headline)', fontSize: '20px', fontWeight: 600, color: 'var(--color-tertiary)' }}>Open to offers</div>
              )}
              <div className="stat-label" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>Category</div>
              <div style={{ fontWeight: 600 }}>{emoji} {task.category}</div>
              <div className="stat-label" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>Offers received</div>
              <div style={{ fontWeight: 600 }}>{allOffers.filter(o => o.status !== 'withdrawn').length}</div>
            </div>
          </div>

          {/* Client info */}
          {clientUser && (
            <div className="card">
              <div className="card-header"><h2 className="text-headline-sm">Posted by</h2></div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Avatar name={clientUser.name} avatarUrl={clientUser.avatarUrl} size="md" />
                <div>
                  <div style={{ fontWeight: 600 }}>{clientUser.name}</div>
                  <Link to={`/profile/${clientUser.id}`} style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    View Profile →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={withdrawConfirm}
        onClose={() => setWithdrawConfirm(false)}
        onConfirm={handleWithdraw}
        title="Withdraw your offer?"
        message="This will remove your offer from this task. You can submit a new offer if the task is still open."
        confirmLabel="Withdraw"
        confirmVariant="danger"
        isLoading={isLoading}
      />
      <ConfirmModal
        isOpen={!!updateStatusConfirm}
        onClose={() => setUpdateStatusConfirm(null)}
        onConfirm={handleUpdateStatus}
        title="Update job status?"
        message={`This will mark the job as "${updateStatusConfirm}". The client will be notified.`}
        confirmLabel="Update Status"
        isLoading={isLoading}
      />

      <style>{`
        @media (max-width: 767px) {
          .ct-task-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
