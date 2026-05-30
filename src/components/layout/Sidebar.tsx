import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  ListTodo, Bell, MessageSquare, LogOut, Search, Settings, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { useTranslation } from '../../context/LanguageContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { to: '/browse',    label: 'Browse Tasks', icon: <Search size={17} /> },
  { to: '/my-tasks',  label: 'My Tasks',     icon: <ListTodo size={17} /> },
  { to: '/messages',  label: 'Messages',     icon: <MessageSquare size={17} /> },
];

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { state } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!currentUser) return null;

  const unreadCount = state.notifications.filter(
    (n) => n.userId === currentUser.id && !n.isRead
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0, top: 0,
      zIndex: 100,
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '20px 20px 18px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38,
          background: 'var(--color-primary-container)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-headline)',
          fontWeight: 800, fontSize: '17px',
          color: 'var(--color-on-primary-container)',
          flexShrink: 0,
          letterSpacing: '-0.02em',
        }}>
          TB
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-headline)',
            fontWeight: 700, fontSize: '16px',
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}>
            Dopzy
          </div>
          <div style={{
            fontSize: 'var(--text-label-md)',
            color: 'var(--sidebar-text-muted)',
            marginTop: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}>
            Service Marketplace
          </div>
        </div>
      </div>

      {/* ── User info ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex', alignItems: 'center', gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{
          border: '2px solid rgba(255,215,0,0.35)',
          borderRadius: '50%',
          padding: 2,
          flexShrink: 0,
        }}>
          <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            fontWeight: 600, fontSize: '13px',
            color: '#ffffff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentUser.name}
          </div>
          <div style={{
            fontSize: 'var(--text-label-md)',
            color: 'var(--sidebar-text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontWeight: 500,
          }}>
            {currentUser.role === 'admin' ? 'Admin' : 'Member'}
          </div>
          <Link
            to={`/profile/${currentUser.id}`}
            style={{
              fontSize: '11px',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-block',
              marginTop: '1px'
            }}
          >
            {t('nav.profile_view') || 'View Profile'}
          </Link>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>

        {/* Workspace section */}
        <div style={{
          fontSize: '10px', fontWeight: 600,
          color: 'var(--sidebar-label-color)',
          textTransform: 'uppercase', letterSpacing: '0.10em',
          padding: '8px 10px 6px',
        }}>
          Workspace
        </div>
        {mainNav.map((item) => {
          let labelKey = 'browse_tasks';
          if (item.to === '/my-tasks') labelKey = 'my_tasks';
          if (item.to === '/messages') labelKey = 'messages';
          return (
            <SidebarLink key={item.to} to={item.to} label={t(`nav.${labelKey}`)} icon={item.icon} />
          );
        })}

        {currentUser.role === 'admin' && (
          <>
            <div style={{ height: '1px', background: 'var(--sidebar-border)', margin: '10px 4px' }} />
            <div style={{
              fontSize: '10px', fontWeight: 600,
              color: 'var(--sidebar-label-color)',
              textTransform: 'uppercase', letterSpacing: '0.10em',
              padding: '8px 10px 6px',
            }}>
              Administration
            </div>
            <SidebarLink
              to="/admin/moderation"
              label={t('nav.moderation') || 'Moderation Panel'}
              icon={<Shield size={17} />}
            />
          </>
        )}

        <div style={{ height: '1px', background: 'var(--sidebar-border)', margin: '10px 4px' }} />

        {/* Account section */}
        <div style={{
          fontSize: '10px', fontWeight: 600,
          color: 'var(--sidebar-label-color)',
          textTransform: 'uppercase', letterSpacing: '0.10em',
          padding: '8px 10px 6px',
        }}>
          Account
        </div>
        <SidebarLink
          to="/notifications"
          label={t('nav.notifications')}
          icon={<Bell size={17} />}
          badge={unreadCount > 0 ? unreadCount : undefined}
        />
        <SidebarLink to="/settings" label={t('nav.settings')} icon={<Settings size={17} />} />
      </nav>

      {/* ── Sign out ── */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: '1px solid var(--sidebar-border)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px',
            borderRadius: 'var(--radius)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ff6b6b';
            e.currentTarget.style.background = 'rgba(255,107,107,0.10)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <LogOut size={17} />
          {t('nav.logout')}
        </button>
      </div>

    </aside>
  );
}

function SidebarLink({ to, label, icon, badge }: NavItem & { badge?: number }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: 'var(--radius)',
        fontSize: '13.5px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
        background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        marginBottom: '2px',
        position: 'relative',
      })}
      onMouseEnter={(e) => {
        if (!(e.currentTarget as HTMLElement).getAttribute('aria-current')) {
          (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        const isActive = (e.currentTarget as HTMLElement).getAttribute('aria-current') === 'page';
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      <span style={{ opacity: 0.85, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{
          background: 'var(--color-primary-container)',
          color: 'var(--color-on-primary-container)',
          borderRadius: 'var(--radius-full)',
          fontSize: '10px', fontWeight: 700,
          padding: '1px 7px',
          minWidth: '20px', textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}
