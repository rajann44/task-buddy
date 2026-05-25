import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Briefcase, ListTodo, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';

export function MobileNav() {
  const { currentUser, logout } = useAuth();
  const { state } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const unreadCount = state.notifications.filter(
    (n) => n.userId === currentUser.id && !n.isRead
  ).length;

  const isClient = currentUser.role === 'client' || currentUser.role === 'admin';

  const navItems = isClient
    ? [
        { to: '/client/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/client/tasks', label: 'Tasks', icon: ListTodo },
        { to: '/notifications', label: 'Alerts', icon: Bell },
      ]
    : [
        { to: '/cotasker/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/cotasker/tasks', label: 'Browse', icon: Search },
        { to: '/cotasker/jobs', label: 'Jobs', icon: Briefcase },
        { to: '/notifications', label: 'Alerts', icon: Bell },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--color-surface-white)',
      borderTop: '1px solid var(--color-outline-variant)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 200,
      height: 64,
    }}>
      {navItems.map(({ to, label, icon: Icon }) => {
        const showBadge = to === '/notifications' && unreadCount > 0;
        return (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              fontSize: '10px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              padding: '8px 0',
              position: 'relative',
            })}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} />
              {showBadge && (
                <span style={{
                  position: 'absolute',
                  top: -4, right: -4,
                  width: 14, height: 14,
                  background: 'var(--color-status-error)',
                  borderRadius: '50%',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
          </NavLink>
        );
      })}
      <button
        onClick={handleLogout}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--color-status-error)',
          padding: '8px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <LogOut size={20} />
        Logout
      </button>
    </nav>
  );
}
