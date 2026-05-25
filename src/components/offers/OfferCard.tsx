import { useState } from 'react';
import { Star, Clock, DollarSign, CheckCircle, MessageSquare } from 'lucide-react';
import type { Offer } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { profileService } from '../../services/profileService';
import { useEffect } from 'react';
import type { User, CoTaskerProfile } from '../../types';

interface OfferCardProps {
  offer: Offer;
  onAccept?: (offerId: string) => void;
  onWithdraw?: (offerId: string) => void;
  onEdit?: (offer: Offer) => void;
  viewerRole: 'client' | 'cotasker' | 'admin';
  showActions?: boolean;
}

export function OfferCard({ offer, onAccept, onWithdraw, viewerRole, showActions = true }: OfferCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CoTaskerProfile | null>(null);

  useEffect(() => {
    profileService.getUserById(offer.coTaskerId).then(setUser);
    profileService.getCoTaskerProfile(offer.coTaskerId).then(setProfile);
  }, [offer.coTaskerId]);

  return (
    <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
      <div className="card-body">
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <Avatar name={user?.name ?? '?'} avatarUrl={user?.avatarUrl} size="lg" />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--text-body-md)', color: 'var(--color-on-surface)' }}>
                {user?.name ?? 'Loading...'}
              </span>
              {profile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-body-sm)', color: 'var(--color-primary)' }}>
                  <Star size={13} fill="currentColor" />
                  {profile.rating} ({profile.reviewCount} reviews)
                </span>
              )}
              <StatusBadge status={offer.status} />
            </div>

            {/* Message */}
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-3)', lineHeight: 'var(--lh-body-md)' }}>
              <MessageSquare size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {offer.message}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '18px', color: 'var(--color-on-surface)', fontFamily: 'var(--font-headline)' }}>
                <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
                {formatCurrency(offer.price)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                ~{offer.estimatedHours}h
              </span>
              {profile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={13} style={{ color: 'var(--color-status-success)' }} />
                  {profile.completedJobs} jobs done
                </span>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--color-on-surface-variant)' }}>
                {formatRelativeTime(offer.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && offer.status === 'pending' && (
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-surface-container)', display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            {viewerRole === 'client' && onAccept && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAccept(offer.id)}
              >
                <CheckCircle size={14} />
                Accept Offer
              </button>
            )}
            {viewerRole === 'cotasker' && onWithdraw && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onWithdraw(offer.id)}
              >
                Withdraw Offer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
