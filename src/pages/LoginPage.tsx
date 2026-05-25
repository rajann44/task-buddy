import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Sarah Mitchell (Client Focus)', email: 'client@demo.com', password: '123456', color: 'var(--color-secondary)' },
  { label: 'Marcus Weber (Tasker Focus)', email: 'cotasker@demo.com', password: '123456', color: 'var(--color-primary-container)' },
  { label: 'Admin Account', email: 'admin@demo.com', password: '123456', color: 'var(--color-tertiary)' },
];

export function LoginPage() {
  const { currentUser, login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (currentUser) {
    return <Navigate to="/browse" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back!', 'success');
      // Navigate handled by the redirect above on next render
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--color-surface)',
    }}>
      {/* Left: Brand Panel */}
      <div style={{
        background: 'var(--color-secondary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-12)',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-brand-panel">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', zIndex: 1 }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--color-primary-container)',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-headline)',
            fontWeight: 800, fontSize: '22px',
            color: 'var(--color-on-primary-container)',
          }}>
            TB
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '20px', color: '#fff' }}>TaskBuddy</div>
            <div style={{ fontSize: 'var(--text-label-md)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Service Marketplace</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '42px', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
            Get things done.<br />
            <span style={{ color: 'var(--color-primary-container)' }}>Reliably.</span>
          </h1>
          <p style={{ fontSize: 'var(--text-body-lg)', color: 'rgba(255,255,255,0.75)', lineHeight: 'var(--lh-body-lg)', maxWidth: '380px' }}>
            Connect with vetted, trusted service providers in your area. From moving to cleaning — every task, matched perfectly.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 'var(--space-8)', zIndex: 1 }}>
          {[['2,400+', 'Tasks Completed'], ['98%', 'Satisfaction Rate'], ['500+', 'Verified Providers']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-headline)', fontSize: '28px', fontWeight: 700, color: 'var(--color-primary-container)' }}>{val}</div>
              <div style={{ fontSize: 'var(--text-label-md)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          bottom: -60, right: -60,
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'rgba(255,215,0,0.07)',
          border: '1px solid rgba(255,215,0,0.12)',
        }} />
        <div style={{
          position: 'absolute',
          top: -80, right: 60,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }} />
      </div>

      {/* Right: Form Panel */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-16)',
        background: 'var(--color-surface-white)',
        overflowY: 'auto',
      }} className="login-form-panel">
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-headline-lg)', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 'var(--space-2)' }}>
              Sign In
            </h2>
            <p style={{ fontSize: 'var(--text-body-md)', color: 'var(--color-on-surface-variant)' }}>
              Access your TaskBuddy account
            </p>
          </div>

          {/* Demo Account Cards */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <p style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
              Demo Accounts — Click to fill
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillCredentials(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--color-surface-container-low)',
                    border: `1px solid var(--color-outline-variant)`,
                    borderLeft: `4px solid ${acc.color}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-container)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-container-low)'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)' }}>{acc.label}</div>
                    <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>{acc.email}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-on-surface-variant)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-surface-container-highest)' }} />
            <span style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>or sign in manually</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-surface-container-highest)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer', padding: '4px',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-error-container)',
                color: 'var(--color-on-error-container)',
                borderRadius: 'var(--radius)',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-secondary btn-lg"
              disabled={isLoading}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderColor: 'rgba(255,255,255,0.5)', borderTopColor: '#fff' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
            This is a demo application. All data is simulated.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .login-brand-panel { display: none !important; }
          [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .login-form-panel { padding: var(--space-8) var(--space-5) !important; }
        }
      `}</style>
    </div>
  );
}
