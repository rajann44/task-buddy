import { Bell, CheckCircle, XCircle, AlertCircle, TrendingUp, Star, Package } from 'lucide-react';
import type { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

const typeIcons: Record<string, React.ReactNode> = {
  new_offer: <TrendingUp size={16} />,
  offer_accepted: <CheckCircle size={16} style={{ color: 'var(--color-status-success)' }} />,
  offer_withdrawn: <XCircle size={16} style={{ color: 'var(--color-status-error)' }} />,
  task_assigned: <Package size={16} style={{ color: 'var(--color-tertiary)' }} />,
  task_completed: <CheckCircle size={16} style={{ color: 'var(--color-status-success)' }} />,
  new_review: <Star size={16} style={{ color: 'var(--color-primary-container)' }} />,
  task_cancelled: <XCircle size={16} style={{ color: 'var(--color-status-error)' }} />,
  payment_released: <AlertCircle size={16} style={{ color: 'var(--color-status-success)' }} />,
  default: <Bell size={16} />,
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const icon = typeIcons[notification.type] ?? typeIcons.default;

  return (
    <div
      onClick={() => !notification.isRead && onMarkRead?.(notification.id)}
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        background: notification.isRead ? 'transparent' : 'var(--color-surface-container-low)',
        borderBottom: '1px solid var(--color-surface-container)',
        cursor: notification.isRead ? 'default' : 'pointer',
        transition: 'background var(--transition-fast)',
        position: 'relative',
      }}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span style={{
          position: 'absolute',
          left: 'var(--space-2)',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 6, height: 6,
          borderRadius: '50%',
          background: 'var(--color-primary)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 36, height: 36,
        borderRadius: 'var(--radius)',
        background: 'var(--color-surface-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--color-primary)',
      }}>
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: notification.isRead ? 500 : 700, fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)', marginBottom: '2px' }}>
          {notification.title}
        </div>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', lineHeight: 'var(--lh-body-sm)' }}>
          {notification.message}
        </p>
        <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );
}
