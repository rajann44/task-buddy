import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, withdrawOfferAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';
import { useState } from 'react';
import type { Offer } from '../../types';

export function CoTaskerOffers() {
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const myOffers = state.offers
    .filter((o) => o.coTaskerId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    dispatch(withdrawOfferAction(withdrawTarget));
    showToast('Offer withdrawn.', 'info');
    setWithdrawTarget(null);
    setIsLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-headline-lg">My Offers</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
          {myOffers.length} offer{myOffers.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {myOffers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📬</div>
            <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No offers yet</h3>
            <p>Browse available tasks and send your first offer.</p>
            <Link to="/cotasker/tasks">
              <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Browse Tasks</button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {myOffers.map((offer) => {
            const task = state.tasks.find((t) => t.id === offer.taskId);
            if (!task) return null;
            const emoji = CATEGORY_ICONS[task.category] ?? '📋';
            return (
              <div key={offer.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <span>{emoji}</span>
                        <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>{task.category}</span>
                        <StatusBadge status={offer.status} />
                      </div>
                      <Link to={`/cotasker/tasks/${task.id}`} className="truncate" style={{ fontWeight: 700, fontSize: 'var(--text-body-md)', color: 'var(--color-on-surface)', textDecoration: 'none', display: 'block' }}>
                        {task.title}
                      </Link>
                      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                        {task.location} · {formatDate(task.date)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '22px' }}>{formatCurrency(offer.price)}</div>
                      <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>~{offer.estimatedHours}h</div>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius)', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
                    "{offer.message}"
                  </div>

                  <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>
                      Sent {formatRelativeTime(offer.createdAt)}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Link to={`/cotasker/tasks/${task.id}`}>
                        <button className="btn btn-outlined btn-sm">View Task</button>
                      </Link>
                      {offer.status === 'pending' && (
                        <button className="btn btn-danger btn-sm" onClick={() => setWithdrawTarget(offer.id)}>
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
        title="Withdraw offer?"
        message="This will withdraw your offer. You can submit a new offer if the task is still open."
        confirmLabel="Withdraw"
        confirmVariant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}
