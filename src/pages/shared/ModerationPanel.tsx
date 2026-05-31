import { useState } from 'react';
import { 
  useAppContext, 
  approveCoTaskerAction, 
  rejectCoTaskerAction, 
  approveTaskAction, 
  rejectTaskAction,
  disableUserAction,
  enableUserAction,
  toggleUserCoTaskerAction,
  deleteTaskAction
} from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Check, X, Shield, FileText, UserCheck, Trash2, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../utils/supabaseClient';

export function ModerationPanel() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'tasks'>('pending');
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  // Filter pending data
  const pendingUsers = state.users.filter((u) => u.coTaskerStatus === 'pending');
  const pendingTasks = state.tasks.filter((t) => t.moderationStatus === 'pending');

  // Search filtered users
  const filteredUsers = state.users.filter((u) => {
    const term = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  // Search filtered tasks
  const filteredTasks = state.tasks.filter((t) => {
    const term = taskSearch.toLowerCase();
    return t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term) || t.category.toLowerCase().includes(term);
  });

  // Action handlers
  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ co_tasker_status: 'approved', role: 'cotasker' })
        .eq('id', userId);
      if (error) throw error;
      dispatch(approveCoTaskerAction(userId));
      showToast('Co-Tasker application approved successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to approve user:', err);
      showToast(err.message || 'Failed to approve user in database.', 'error');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ co_tasker_status: 'rejected' })
        .eq('id', userId);
      if (error) throw error;
      dispatch(rejectCoTaskerAction(userId));
      showToast('Co-Tasker application declined.', 'info');
    } catch (err: any) {
      console.error('Failed to reject user:', err);
      showToast(err.message || 'Failed to reject user in database.', 'error');
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ moderation_status: 'approved' })
        .eq('id', taskId);
      if (error) throw error;
      dispatch(approveTaskAction(taskId));
      showToast('Task approved and listed in the marketplace!', 'success');
    } catch (err: any) {
      console.error('Failed to approve task:', err);
      showToast(err.message || 'Failed to approve task in database.', 'error');
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ moderation_status: 'rejected' })
        .eq('id', taskId);
      if (error) throw error;
      dispatch(rejectTaskAction(taskId));
      showToast('Task rejected from the marketplace.', 'info');
    } catch (err: any) {
      console.error('Failed to reject task:', err);
      showToast(err.message || 'Failed to reject task in database.', 'error');
    }
  };

  const handleToggleDisableUser = async (userId: string, currentDisabled: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_disabled: !currentDisabled })
        .eq('id', userId);
      if (error) throw error;
      
      if (currentDisabled) {
        dispatch(enableUserAction(userId));
        showToast('User account has been enabled.', 'success');
      } else {
        dispatch(disableUserAction(userId));
        showToast('User account has been disabled and logged out.', 'warning');
      }
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      showToast(err.message || 'Failed to update user status in database.', 'error');
    }
  };

  const handleToggleCoTasker = async (userId: string, isCoTasker: boolean) => {
    try {
      const nextRole = isCoTasker ? 'client' : 'cotasker';
      const nextStatus = isCoTasker ? 'none' : 'approved';
      const { error } = await supabase
        .from('users')
        .update({ role: nextRole, co_tasker_status: nextStatus })
        .eq('id', userId);
      if (error) throw error;

      dispatch(toggleUserCoTaskerAction(userId, !isCoTasker));
      showToast(
        isCoTasker 
          ? 'Co-Tasker status revoked. User is now a regular client.' 
          : 'User promoted to approved Co-Tasker status.', 
        'success'
      );
    } catch (err: any) {
      console.error('Failed to toggle co-tasker role:', err);
      showToast(err.message || 'Failed to update user role in database.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this task listing?')) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
        if (error) throw error;

        dispatch(deleteTaskAction(taskId));
        showToast('Task listing deleted permanently.', 'error');
      } catch (err: any) {
        console.error('Failed to delete task:', err);
        showToast(err.message || 'Failed to delete task from database.', 'error');
      }
    }
  };

  return (
    <div>
      <div className="page-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={24} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h1 className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>
              {t('moderation.title') || 'Moderation & Admin Panel'}
            </h1>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: '4px 0 0 0' }}>
              Moderate accounts, toggle roles, and approve task listings
            </p>
          </div>
        </div>
      </div>

      <div className="page-inner">
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-surface-container-highest)', paddingBottom: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`chip ${activeTab === 'pending' ? 'chip-active' : ''}`}
            style={{ padding: '8px var(--space-4)', fontSize: 'var(--text-body-sm)', borderRadius: 'var(--radius)' }}
          >
            Pending Approvals ({pendingUsers.length + pendingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`chip ${activeTab === 'users' ? 'chip-active' : ''}`}
            style={{ padding: '8px var(--space-4)', fontSize: 'var(--text-body-sm)', borderRadius: 'var(--radius)' }}
          >
            All Users ({state.users.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`chip ${activeTab === 'tasks' ? 'chip-active' : ''}`}
            style={{ padding: '8px var(--space-4)', fontSize: 'var(--text-body-sm)', borderRadius: 'var(--radius)' }}
          >
            All Tasks ({state.tasks.length})
          </button>
        </div>

        {/* Tab Content 1: Pending Approvals */}
        {activeTab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Co-Tasker applications */}
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
                Pending Co-Tasker Applications ({pendingUsers.length})
              </div>
              {pendingUsers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="card" style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-secondary)' }}>
                            {user.name}
                          </h3>
                          <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                            {user.email} · Applied {formatDate(user.createdAt)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="btn btn-outlined btn-sm"
                            style={{ color: 'var(--color-status-error)', borderColor: 'var(--color-status-error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <X size={14} /> Reject
                          </button>
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={14} /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                    <UserCheck size={28} style={{ opacity: 0.4, marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No pending applications</p>
                  </div>
                </div>
              )}
            </div>

            {/* Task moderation */}
            <div>
              <div className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
                Tasks Pending Moderation ({pendingTasks.length})
              </div>
              {pendingTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="card" style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
                        <div>
                          <span className="chip" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', display: 'inline-block' }}>
                            {task.category}
                          </span>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-secondary)' }}>
                            {task.title}
                          </h3>
                          <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                            📍 {task.location} · 💶 Budget: {task.budgetType === 'open_to_offers' ? 'Open Bids' : formatCurrency(task.budget || 0)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRejectTask(task.id)}
                            className="btn btn-outlined btn-sm"
                            style={{ color: 'var(--color-status-error)', borderColor: 'var(--color-status-error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <X size={14} /> Reject
                          </button>
                          <button
                            onClick={() => handleApproveTask(task.id)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={14} /> Approve
                          </button>
                        </div>
                      </div>
                      <div style={{
                        background: 'var(--color-surface-container-lowest)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: 'var(--radius)',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: 'var(--color-on-surface-variant)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {task.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                    <FileText size={28} style={{ opacity: 0.4, marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No tasks pending review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: All Users */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Search filter */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: 'none',
                  borderBottom: '1.5px solid var(--color-outline-variant)',
                  borderRadius: 0,
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--color-on-surface)'
                }}
              />
            </div>

            <div className="transaction-rows-container">
              <div className="transaction-row-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr' }}>
                <span>User Info</span>
                <span>Role</span>
                <span>Co-Tasker Status</span>
                <span style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</span>
              </div>
              
              {filteredUsers.map((user) => {
                const isCoTasker = user.role === 'cotasker';
                const isUserAdmin = user.role === 'admin';
                return (
                  <div key={user.id} className="transaction-row-item" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', cursor: 'default' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: user.isDisabled ? 'var(--color-on-surface-variant)' : 'var(--color-secondary)' }}>
                        {user.name} {user.isDisabled && <span style={{ color: 'var(--color-status-error)', fontSize: '11px', fontWeight: 600 }}>(DISABLED)</span>}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                        {user.email}
                      </span>
                    </div>

                    <div>
                      <span style={{ textTransform: 'capitalize', fontSize: 'var(--text-body-sm)' }}>
                        {user.role}
                      </span>
                    </div>

                    <div>
                      <span className={`badge badge-${user.coTaskerStatus || 'none'}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {user.coTaskerStatus || 'none'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingRight: '16px' }}>
                      {!isUserAdmin && (
                        <>
                          <button
                            onClick={() => handleToggleCoTasker(user.id, isCoTasker)}
                            className="btn btn-outlined btn-xs"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                          >
                            {isCoTasker ? 'Revoke Co-Tasker' : 'Promote Co-Tasker'}
                          </button>
                          <button
                            onClick={() => handleToggleDisableUser(user.id, !!user.isDisabled)}
                            className={`btn btn-xs ${user.isDisabled ? 'btn-primary' : 'btn-danger'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                          >
                            {user.isDisabled ? 'Enable Account' : 'Disable Account'}
                          </button>
                        </>
                      )}
                      {isUserAdmin && (
                        <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>System Administrator</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content 3: All Tasks */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Search filter */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
              <input
                type="text"
                placeholder="Search tasks by title, category, or description..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: 'none',
                  borderBottom: '1.5px solid var(--color-outline-variant)',
                  borderRadius: 0,
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--color-on-surface)'
                }}
              />
            </div>

            <div className="transaction-rows-container">
              <div className="transaction-row-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr' }}>
                <span>Task Listing</span>
                <span>Category</span>
                <span>Flow Status</span>
                <span>Moderation</span>
                <span style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</span>
              </div>
              
              {filteredTasks.map((task) => (
                <div key={task.id} className="transaction-row-item" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', cursor: 'default' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{task.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
                      📍 {task.location} · 💶 {task.budgetType === 'open_to_offers' ? 'Open Bids' : formatCurrency(task.budget || 0)}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: 'var(--text-body-sm)' }}>{task.category}</span>
                  </div>

                  <div>
                    <span className="badge badge-secondary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                      {task.status}
                    </span>
                  </div>

                  <div>
                    <span className={`badge badge-${task.moderationStatus || 'approved'}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                      {task.moderationStatus || 'approved'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingRight: '16px' }}>
                    {task.moderationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveTask(task.id)}
                          className="btn btn-primary btn-xs"
                          style={{ padding: '4px 6px' }}
                          title="Approve Listing"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => handleRejectTask(task.id)}
                          className="btn btn-outlined btn-xs"
                          style={{ color: 'var(--color-status-error)', borderColor: 'var(--color-status-error)', padding: '4px 6px' }}
                          title="Reject Listing"
                        >
                          <X size={12} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn btn-danger btn-xs"
                      style={{ padding: '4px 6px' }}
                      title="Delete Listing Permanently"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ModerationPanel;
