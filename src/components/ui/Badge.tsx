import React from 'react';
import type { TaskStatus, OfferStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/constants';

interface BadgeProps {
  status: TaskStatus | OfferStatus | string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showDot = false, size: _size = 'md' }: BadgeProps) {
  return (
    <span className={`badge badge-${status}`}>
      {showDot && <span className={`status-dot status-dot-${status}`} />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

export function Badge({ children, variant = '', className = '' }: GenericBadgeProps) {
  return (
    <span className={`badge ${variant} ${className}`}>
      {children}
    </span>
  );
}

export function ProfileBadge({ type }: { type: 'verified' | 'top-rated' | 'fast' }) {
  const labels = {
    verified: '✓ ID Verified',
    'top-rated': '⭐ Top Rated',
    fast: '⚡ Fast Responder',
  };
  return (
    <span className={`badge badge-${type}`}>
      {labels[type]}
    </span>
  );
}
