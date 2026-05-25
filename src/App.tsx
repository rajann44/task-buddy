import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientTasks } from './pages/client/ClientTasks';
import { NewTaskPage } from './pages/client/NewTaskPage';
import { ClientTaskDetail } from './pages/client/ClientTaskDetail';
import { ClientOffers } from './pages/client/ClientOffers';
import { CoTaskerDashboard } from './pages/cotasker/CoTaskerDashboard';
import { TaskMarketplace } from './pages/cotasker/TaskMarketplace';
import { CoTaskerTaskDetail } from './pages/cotasker/CoTaskerTaskDetail';
import { CoTaskerOffers } from './pages/cotasker/CoTaskerOffers';
import { CoTaskerJobs } from './pages/cotasker/CoTaskerJobs';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { ProfilePage } from './pages/shared/ProfilePage';
import { MessagesPage, SettingsPage } from './pages/shared/PlaceholderPages';

import './styles/index.css';

function RoleRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'cotasker') return <Navigate to="/cotasker/dashboard" replace />;
  return <Navigate to="/client/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RoleRedirect />} />

              {/* Client routes */}
              <Route element={<ProtectedRoute allowedRoles={['client', 'admin']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/client/dashboard" element={<ClientDashboard />} />
                  <Route path="/client/tasks" element={<ClientTasks />} />
                  <Route path="/client/tasks/new" element={<NewTaskPage />} />
                  <Route path="/client/tasks/:id" element={<ClientTaskDetail />} />
                  <Route path="/client/offers" element={<ClientOffers />} />
                </Route>
              </Route>

              {/* CoTasker routes */}
              <Route element={<ProtectedRoute allowedRoles={['cotasker']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/cotasker/dashboard" element={<CoTaskerDashboard />} />
                  <Route path="/cotasker/tasks" element={<TaskMarketplace />} />
                  <Route path="/cotasker/tasks/:id" element={<CoTaskerTaskDetail />} />
                  <Route path="/cotasker/my-offers" element={<CoTaskerOffers />} />
                  <Route path="/cotasker/jobs" element={<CoTaskerJobs />} />
                </Route>
              </Route>

              {/* Shared authenticated routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile/:id" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
