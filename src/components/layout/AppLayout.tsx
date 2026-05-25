import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/Toast';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-surface)' }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }} className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="page-content"
          style={{
            flex: 1,
            padding: 'var(--space-6) var(--space-4)',
            maxWidth: '100%',
          }}
        >
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="mobile-nav-container">
        <MobileNav />
      </div>

      <ToastContainer />

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop {
            display: block !important;
            width: var(--sidebar-width);
            flex-shrink: 0;
          }
          main {
            margin-left: var(--sidebar-width);
          }
          .mobile-nav-container {
            display: none;
          }
          #main-content > div {
            padding: var(--space-8) var(--space-8) !important;
          }
        }
      `}</style>
    </div>
  );
}
