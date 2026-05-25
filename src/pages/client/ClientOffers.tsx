import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, withdrawOfferAction } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import type { Offer, Task } from '../../types';
import { CATEGORY_ICONS } from '../../utils/constants';

export function ClientOffers() {
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();

  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get all offers on client's tasks
  const clientTaskIds = state.tasks
    .filter((t) => t.clientId === currentUser?.id)
    .map((t) => t.id);

  const offers = state.offers.filter((o) => clientTaskIds.includes(o.taskId));

  // Group by task
  const offersByTask: Record<string, { task: Task; offers: Offer[] }> = {};
  for (const offer of offers) {
    const task = state.tasks.find((t) => t.id === offer.taskId);
    if (!task) continue;
    if (!offersByTask[offer.taskId]) {
      offersByTask[offer.taskId] = { task, offers: [] };
    }
    offersByTask[offer.taskId].offers.push(offer);
  }

  const pendingCount = offers.filter((o) => o.status === 'pending').length;

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-headline-lg">Received Offers</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
          {pendingCount} pending offer{pendingCount !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {Object.keys(offersByTask).length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📬</div>
            <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>No offers yet</h3>
            <p>Post a task to start receiving offers from providers.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {Object.values(offersByTask).map(({ task, offers: taskOffers }) => (
            <div key={task.id} className="card">
              {/* Task header */}
              <div className="card-header">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <span>{CATEGORY_ICONS[task.category]}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <Link to={`/client/tasks/${task.id}`} className="truncate" style={{ fontWeight: 700, fontSize: 'var(--text-body-md)', color: 'var(--color-on-surface)', textDecoration: 'none' }}>
                    {task.title}
                  </Link>
                  <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                    {formatDate(task.date)} · {task.location}
                  </div>
                </div>
                <Link to={`/client/tasks/${task.id}`}>
                  <button className="btn btn-outlined btn-sm">View Task</button>
                </Link>
              </div>

              {/* Offers table */}
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Price</th>
                      <th>Est. Hours</th>
                      <th>Status</th>
                      <th>Received</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskOffers.map((offer) => {
                      const coTasker = state.offers.find(o => o.id === offer.id);
                      return (
                        <tr key={offer.id}>
                          <td style={{ fontWeight: 500 }}>Provider #{offer.coTaskerId.slice(-4)}</td>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-headline)' }}>{formatCurrency(offer.price)}</td>
                          <td>{offer.estimatedHours}h</td>
                          <td><StatusBadge status={offer.status} /></td>
                          <td style={{ color: 'var(--color-on-surface-variant)' }}>{formatRelativeTime(offer.createdAt)}</td>
                          <td>
                            {offer.status === 'pending' && task.status === 'receiving_offers' && (
                              <Link to={`/client/tasks/${task.id}`}>
                                <button className="btn btn-primary btn-sm">Accept</button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
