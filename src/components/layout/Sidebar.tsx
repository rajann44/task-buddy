import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, PlusCircle, Bell, MessageSquare,
  User, LogOut, Briefcase, Search, ClipboardList, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const clientNav: NavItem[] = [
  { to: '/client/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/client/tasks', label: 'My Tasks', icon: <ListTodo size={18} /> },
  { to: '/client/tasks/new', label: 'Post a Task', icon: <PlusCircle size={18} /> },
  { to: '/client/offers', label: 'My Offers', icon: <ClipboardList size={18} /> },
];

const cotaskerNav: NavItem[] = [
  { to: '/cotasker/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/cotasker/tasks', label: 'Browse Tasks', icon: <Search size={18} /> },
  { to: '/cotasker/my-offers', label: 'My Offers', icon: <ClipboardList size={18} /> },
  { to: '/cotasker/jobs', label: 'My Jobs', icon: <Briefcase size={18} /> },
];

const sharedNav: NavItem[] = [
  { to: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { to: '/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
];

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { state } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const mainNav = currentUser.role === 'client' || currentUser.role === 'admin'
    ? clientNav : cotaskerNav;

  const unreadCount = state.notifications.filter(
    (n) => n.userId === currentUser.id && !n.isRead
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-surface-white)',
        borderRight: '1px solid var(--color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px var(--space-5)',
        borderBottom: '1px solid var(--color-surface-container-highest)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--color-primary-container)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800,
          fontFamily: 'var(--font-headline)',
          fontSize: '18px',
          color: 'var(--color-on-primary-container)',
          flexShrink: 0,
        }}>
          TB
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '16px', color: 'var(--color-on-surface)', lineHeight: 1 }}>
            TaskBuddy
          </div>
          <div style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentUser.role === 'cotasker' ? 'Provider' : currentUser.role === 'admin' ? 'Admin' : 'Client'}
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--color-surface-container)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="md" />
        <div style={{ minWidth: 0 }}>
          <div className="truncate" style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)' }}>
            {currentUser.name}
          </div>
          <div className="truncate" style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-on-surface-variant)' }}>
            {currentUser.email}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-3) var(--space-3)' }}>
        <div style={{ fontSize: 'var(--text-label-md)', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 'var(--space-2) var(--space-2)', marginBottom: 'var(--space-1)' }}>
          {currentUser.role === 'cotasker' ? 'Provider Menu' : 'Client Menu'}
        </div>
        {mainNav.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}

        <div style={{ height: '1px', background: 'var(--color-surface-container)', margin: 'var(--space-3) 0' }} />

        <div style={{ fontSize: 'var(--text-label-md)', fontWeight: 600, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 'var(--space-2) var(--space-2)', marginBottom: 'var(--space-1)' }}>
          General
        </div>
        {sharedNav.map((item) => (
          <SidebarLink
            key={item.to}
            {...item}
            badge={item.to === '/notifications' && unreadCount > 0 ? unreadCount : undefined}
          />
        ))}
        <SidebarLink
          to={`/profile/${currentUser.id}`}
          label="My Profile"
          icon={<User size={18} />}
        />
        <SidebarLink
          to="/settings"
          label="Settings"
          icon={<Settings size={18} />}
        />
      </nav>

      {/* Logout */}
      <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-surface-container-highest)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-status-error)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-error-container)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={16} />
          Sign Out
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
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius)',
        fontSize: 'var(--text-body-sm)',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)',
        background: isActive ? 'var(--color-primary-container)' : 'transparent',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        marginBottom: '2px',
        position: 'relative',
      })}
      end={to.endsWith('dashboard')}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{
          background: 'var(--color-status-error)',
          color: '#fff',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 700,
          padding: '1px 6px',
          minWidth: '20px',
          textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}
