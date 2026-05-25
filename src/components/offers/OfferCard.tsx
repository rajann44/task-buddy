import { useState, useEffect } from 'react';
import { Star, Clock } from 'lucide-react';
import type { Offer, User, CoTaskerProfile } from '../../types';
import { StatusBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { profileService } from '../../services/profileService';

interface OfferCardProps {
  offer: Offer;
  onAccept?: (offerId: string) => void;
  onWithdraw?: (offerId: string) => void;
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
    <div className="transaction-row-item" style={{ gridTemplateColumns: '56px 1.5fr 2fr 130px 160px', padding: '16px var(--space-4)' }}>
      {/* 1. Initials / Avatar Column */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={user?.name ?? '?'} avatarUrl={user?.avatarUrl} size="md" />
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--color-primary-container)',
            border: '2px solid var(--color-surface-white)'
          }}></span>
        </div>
      </div>

      {/* 2. Provider Info & Rating */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: '12px' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-secondary)', fontSize: 'var(--text-body-sm)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {user?.name ?? 'Loading...'}
        </span>
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
              <Star size={11} fill="var(--color-primary-container)" color="var(--color-primary)" />
              {profile.rating}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>
              ({profile.completedJobs} jobs done)
            </span>
          </div>
        )}
      </div>

      {/* 3. Bid Proposal Message */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, paddingRight: '12px' }}>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)', margin: 0, fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          "{offer.message}"
        </p>
      </div>

      {/* 4. Timeline / Effort */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary-mid)', fontWeight: 500 }}>
          <Clock size={13} /> ~{offer.estimatedHours} hours
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', marginTop: '2px', textTransform: 'uppercase' }}>
          {formatRelativeTime(offer.createdAt)}
        </span>
      </div>

      {/* 5. Pricing & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="transaction-amount-green" style={{ fontSize: '16px' }}>
            {formatCurrency(offer.price)}
          </div>
          <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', marginTop: '1px' }}>
            Bid Price
          </div>
        </div>

        {showActions && offer.status === 'pending' ? (
          <div>
            {viewerRole === 'client' && onAccept && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAccept(offer.id)}
                style={{ padding: '6px 12px', fontSize: '10.5px' }}
              >
                Accept
              </button>
            )}
            {viewerRole === 'cotasker' && onWithdraw && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onWithdraw(offer.id)}
                style={{ padding: '6px 12px', fontSize: '10.5px' }}
              >
                Withdraw
              </button>
            )}
          </div>
        ) : (
          <div style={{ flexShrink: 0 }}>
            <StatusBadge status={offer.status} />
          </div>
        )}
      </div>
    </div>
  );
}
