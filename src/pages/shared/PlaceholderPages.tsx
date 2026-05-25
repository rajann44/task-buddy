import { MessageSquare } from 'lucide-react';

export function MessagesPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-headline-lg">Messages</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
          Direct messaging between clients and providers
        </p>
      </div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><MessageSquare size={48} /></div>
          <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>Messaging coming soon</h3>
          <p>In-app messaging will be available in the next release. Providers and clients will be able to communicate directly about task details.</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-headline-lg">Settings</h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-1)' }}>
          Manage your account preferences
        </p>
      </div>
      <div className="card">
        <div className="empty-state">
          <h3 className="text-headline-sm" style={{ marginBottom: 'var(--space-2)' }}>Settings coming soon</h3>
          <p>Account settings and preferences will be available in a future update.</p>
        </div>
      </div>
    </div>
  );
}
