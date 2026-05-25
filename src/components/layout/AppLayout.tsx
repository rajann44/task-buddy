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
          .mobile-nav-container {
            display: none;
          }
          #main-content > div {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
