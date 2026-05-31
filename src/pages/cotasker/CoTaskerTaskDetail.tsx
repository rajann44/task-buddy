import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, DollarSign, User, Wallet, Users, MessageSquare, HelpCircle } from 'lucide-react';
import posthog from '../../utils/posthogClient';
import { useAuth } from '../../context/AuthContext';
import {
  useAppContext,
  createOfferAction,
  withdrawOfferAction,
  updateTaskStatusAction,
  addNotificationAction,
  createChatRequestAction,
  createConversationAction,
  sendChatMessageAction
} from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/ui/Badge';
import { OfferForm } from '../../components/offers/OfferForm';
import { OfferCard } from '../../components/offers/OfferCard';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { profileService } from '../../services/profileService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { CATEGORY_ICONS } from '../../utils/constants';
import type { Offer, User as UserType } from '../../types';
import { supabase } from '../../utils/supabaseClient';

export function CoTaskerTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const task = state.tasks.find((t) => t.id === id);
  const myOffer = state.offers.find(
    (o) => o.taskId === id && o.coTaskerId === currentUser?.id && o.status !== 'withdrawn'
  );
  const allOffers = state.offers.filter((o) => o.taskId === id);

  const [clientUser, setClientUser] = useState<UserType | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [updateStatusConfirm, setUpdateStatusConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  const pendingChatRequest = state.chatRequests?.find(
    (r) => r.taskId === id && r.senderId === currentUser?.id && r.status === 'pending'
  );
  const acceptedChatRequest = state.chatRequests?.find(
    (r) => r.taskId === id && r.senderId === currentUser?.id && r.status === 'accepted'
  );
  const conversation = state.conversations?.find(
    (c) => c.taskId === id && c.participantIds.includes(currentUser!.id)
  );

  useEffect(() => {
    if (task?.clientId) profileService.getUserById(task.clientId).then(setClientUser);
  }, [task?.clientId]);

  if (!task) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>Task not found</h3>
        <Link to="/browse"><button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Back to Browse</button></Link>
      </div>
    );
  }

  const canOffer = (task.status === 'open' || task.status === 'receiving_offers') && !myOffer;
  const isAssignedToMe = task.assignedCoTaskerId === currentUser?.id;
  const emoji = CATEGORY_ICONS[task.category] ?? '📋';

  const handleAskQuestion = async () => {
    if (!questionText.trim()) return;
    setIsSubmittingQuestion(true);

    try {
      const { data: reqData, error } = await supabase
        .from('chat_requests')
        .insert({
          task_id: task.id,
          sender_id: currentUser!.id,
          receiver_id: task.clientId,
          question: questionText.trim(),
          status: 'pending'
        })
        .select('id, created_at')
        .single();

      if (error) throw error;

      const { data: notifData, error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: task.clientId,
          type: 'new_offer',
          title: 'New task inquiry',
          message: `${currentUser!.name} sent a question about your task "${task.title}".`,
          is_read: false,
          link_to: '/messages'
        })
        .select('id, created_at')
        .single();

      if (notifErr) throw notifErr;

      const newRequest = {
        id: reqData.id,
        taskId: task.id,
        senderId: currentUser!.id,
        receiverId: task.clientId,
        question: questionText.trim(),
        status: 'pending' as const,
        createdAt: reqData.created_at
      };

      dispatch(createChatRequestAction(newRequest));
      dispatch(addNotificationAction({
        id: notifData.id,
        userId: task.clientId,
        type: 'new_offer',
        title: 'New task inquiry',
        message: `${currentUser!.name} sent a question about your task "${task.title}".`,
        isRead: false,
        createdAt: notifData.created_at,
        linkTo: '/messages',
      }));

      showToast('Your question request has been sent to the client!', 'success');
      setQuestionText('');
      setShowQuestionModal(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to send question request', 'error');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleSubmitOffer = async (data: { price: number; message: string; estimatedHours: number }) => {
    setIsLoading(true);

    try {
      // 1. Insert Offer
      const { data: offerData, error: offerErr } = await supabase
        .from('offers')
        .insert({
          task_id: task.id,
          cotasker_id: currentUser!.id,
          price: data.price,
          message: data.message,
          estimated_hours: data.estimatedHours,
          status: 'pending'
        })
        .select('id, created_at')
        .single();
      if (offerErr) throw offerErr;

      const newOffer: Offer = {
        id: offerData.id,
        taskId: task.id,
        coTaskerId: currentUser!.id,
        price: data.price,
        message: data.message,
        estimatedHours: data.estimatedHours,
        status: 'pending',
        createdAt: offerData.created_at,
      };

      // 2. Update Task Status to receiving_offers if it's open
      if (task.status === 'open') {
        const { error: taskErr } = await supabase
          .from('tasks')
          .update({ status: 'receiving_offers' })
          .eq('id', task.id);
        if (taskErr) throw taskErr;
      }

      // Auto-create chat conversation for direct offer submission
      const existingConv = state.conversations.find(
        (c) => c.taskId === task.id && c.participantIds.includes(currentUser!.id)
      );
      let convId: string;
      
      if (!existingConv) {
        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .insert({
            participant_ids: [currentUser!.id, task.clientId],
            last_message: data.message,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
            task_id: task.id
          })
          .select('id')
          .single();
        if (convErr) throw convErr;
        convId = convData.id;

        dispatch(createConversationAction({
          id: convId,
          participantIds: [currentUser!.id, task.clientId],
          lastMessage: data.message,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 1,
          taskId: task.id
        }));
      } else {
        convId = existingConv.id;
        await supabase
          .from('conversations')
          .update({
            last_message: data.message,
            last_message_at: new Date().toISOString()
          })
          .eq('id', convId);
      }

      // 3. Send Message
      const { data: msgData, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: convId,
          sender_id: currentUser!.id,
          text: `Offer Submitted: ${formatCurrency(data.price)}. "${data.message}"`
        })
        .select('id, created_at')
        .single();
      if (msgErr) throw msgErr;

      const newMessage = {
        id: msgData.id,
        conversationId: convId,
        senderId: currentUser!.id,
        text: `Offer Submitted: ${formatCurrency(data.price)}. "${data.message}"`,
        createdAt: msgData.created_at
      };

      // 4. Create Notification
      const { data: notifData, error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: task.clientId,
          type: 'new_offer',
          title: 'New offer received',
          message: `${currentUser!.name} sent an offer of ${formatCurrency(data.price)} for your task "${task.title}".`,
          is_read: false,
          link_to: `/tasks/${task.id}`
        })
        .select('id, created_at')
        .single();
      if (notifErr) throw notifErr;

      const newNotif = {
        id: notifData.id,
        userId: task.clientId,
        type: 'new_offer' as const,
        title: 'New offer received',
        message: `${currentUser!.name} sent an offer of ${formatCurrency(data.price)} for your task "${task.title}".`,
        isRead: false,
        createdAt: notifData.created_at,
        linkTo: `/tasks/${task.id}`,
      };

      dispatch(createOfferAction(newOffer));
      dispatch(sendChatMessageAction(newMessage));
      dispatch(addNotificationAction(newNotif));

      posthog.capture('offer_submitted', {
        offer_id: newOffer.id,
        task_id: task.id,
        category: task.category,
        price: data.price,
        estimated_hours: data.estimatedHours,
      });

      showToast('Offer sent successfully!', 'success');
      setShowOfferForm(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to submit offer', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myOffer) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'withdrawn' })
        .eq('id', myOffer.id);
      if (error) throw error;

      dispatch(withdrawOfferAction(myOffer.id));
      posthog.capture('offer_withdrawn', {
        offer_id: myOffer.id,
        task_id: task.id,
        category: task.category,
      });
      showToast('Offer withdrawn.', 'info');
      setWithdrawConfirm(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to withdraw offer', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateStatusConfirm) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: updateStatusConfirm })
        .eq('id', task.id);
      if (error) throw error;

      dispatch(updateTaskStatusAction(task.id, updateStatusConfirm as any));
      showToast(`Task status updated to "${updateStatusConfirm}".`, 'success');
      setUpdateStatusConfirm(null);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update task status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="section-label" style={{ margin: 0, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{emoji}</span> {task.category}
              </span>
              <StatusBadge status={task.status} />
              {task.taskType === 'remote' ? (
                <span className="badge badge-secondary" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>💻 Remote</span>
              ) : (
                <span className="badge badge-secondary" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>📍 In Person</span>
              )}
              {isAssignedToMe && <span className="badge badge-gold">Your Job</span>}
            </div>
            <h1 className="text-headline-md truncate" style={{ margin: 0, fontWeight: 700 }}>{task.title}</h1>
          </div>
        </div>
      </div>

      <div className="page-inner">
        <div className="bento-grid">
          {/* Main Column */}
          <div className="bento-col-8 flex flex-col gap-6">
            {/* Description */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700 }}>Task Details</h2>
              </div>
              <div className="card-body">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 'var(--lh-body-lg)', color: 'var(--color-on-surface-variant)', margin: 0 }}>
                  {task.description}
                </p>

                {task.mustHaves && task.mustHaves.length > 0 && (
                  <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)' }}>
                    <div className="section-label" style={{ fontSize: '11px', marginBottom: '12px' }}>Must-Haves & Requirements</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {task.mustHaves.map((m, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: '10px var(--space-4)',
                          background: 'var(--color-surface-container-low)',
                          border: '1px solid var(--color-outline-variant)',
                          borderRadius: 'var(--radius)',
                        }}>
                          <div className="transaction-initials-badge" style={{ width: '24px', height: '24px', fontSize: '10px', flexShrink: 0, background: 'var(--color-primary-container)', borderColor: 'var(--color-outline-variant)', color: 'var(--color-secondary)' }}>
                            ✓
                          </div>
                          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface)', fontWeight: 500 }}>
                            {m}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.images && task.images.length > 0 && (
                  <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)' }}>
                    <div className="section-label" style={{ fontSize: '11px', marginBottom: '8px' }}>Reference Images</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {task.images.map((img, i) => (
                        <div key={i} style={{ borderRadius: 'var(--radius)', overflow: 'hidden', width: '180px', height: '120px', border: '1px solid var(--color-outline-variant)' }}>
                          <img src={img} alt={`Reference ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-surface-container-highest)', paddingTop: 'var(--space-4)' }}>
                  <div>
                    <div className="section-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Location</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-body-sm)' }}>
                      <MapPin size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                      <span>{task.location} · {task.address}</span>
                    </div>
                  </div>
                  <div>
                    <div className="section-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Schedule</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-body-sm)' }}>
                      <Calendar size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                      <span>
                        {formatDate(task.date)} {task.time && `at ${task.time}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Offer / Offer Form */}
            {myOffer ? (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div className="section-label" style={{ marginBottom: '12px' }}>Your Active Offer</div>
                <div className="transaction-rows-container">
                  <OfferCard
                    offer={myOffer}
                    onWithdraw={() => setWithdrawConfirm(true)}
                    viewerRole="cotasker"
                    showActions={myOffer.status === 'pending'}
                  />
                </div>
              </div>
            ) : canOffer ? (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700 }}>Make an Offer</h2>
                </div>
                <div className="card-body">
                  {showOfferForm ? (
                    <OfferForm
                      taskId={task.id}
                      coTaskerId={currentUser!.id}
                      onSubmit={handleSubmitOffer}
                      onCancel={() => setShowOfferForm(false)}
                      isLoading={isLoading}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                      <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-4)' }}>
                        Interested in providing this service? Send your offer details to the client or clarify details first.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => setShowOfferForm(true)}>
                          <DollarSign size={16} /> Submit Offer
                        </button>
                        {acceptedChatRequest || conversation ? (
                          <Link to="/messages">
                            <button className="btn btn-outlined" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <MessageSquare size={16} /> Go to Chat
                            </button>
                          </Link>
                        ) : pendingChatRequest ? (
                          <button className="btn btn-outlined" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
                            <MessageSquare size={16} /> Inquiry Pending
                          </button>
                        ) : (
                          <button className="btn btn-outlined" onClick={() => setShowQuestionModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <HelpCircle size={16} /> Ask a Question
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Status update for assigned tasks */}
            {isAssignedToMe && (task.status === 'assigned' || task.status === 'in_progress') && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-headline-sm" style={{ fontSize: '16px', fontWeight: 700 }}>Update Job Status</h2>
                </div>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {task.status === 'assigned' && (
                    <button className="btn btn-secondary" onClick={() => setUpdateStatusConfirm('in_progress')}>
                      Mark as In Progress
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: 0 }}>
                      Waiting for the client to confirm completion and release payment from escrow.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="bento-col-4 flex flex-col gap-6">
            {/* GiroKonto styled Budget Card */}
            <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-container-low)',
                  border: '1.5px solid var(--color-outline-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-secondary)'
                }}>
                  <Wallet size={18} />
                </div>
                <span className="text-label" style={{ fontSize: '9px', color: 'var(--color-on-surface-variant)' }}>Contract Spec</span>
              </div>
              <div>
                <div className="section-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Client Budget</div>
                {task.budgetType === 'fixed' && task.budget ? (
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                    {formatCurrency(task.budget)}
                  </div>
                ) : task.budgetType === 'hourly' && task.budget ? (
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '32px', fontWeight: 700, color: 'var(--color-secondary)', lineHeight: 1.1 }}>
                    {formatCurrency(task.budget)}/hr
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-headline)', fontSize: '24px', fontWeight: 700, color: 'var(--color-secondary-mid)', lineHeight: 1.1 }}>
                    Open to offers
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px', marginTop: '12px', fontSize: 'var(--text-body-sm)', color: 'var(--color-on-surface-variant)' }}>
                {task.budgetType === 'fixed' ? 'Fixed price contract' : task.budgetType === 'hourly' ? 'Hourly rates contract' : 'Open bidding'}
              </div>
            </div>


            {/* Task stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                  Competition
                </h3>
              </div>
              <div className="card-body" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-body-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-on-surface-variant)' }}>Offers submitted</span>
                  <span style={{ fontWeight: 700 }}>{allOffers.filter(o => o.status !== 'withdrawn').length}</span>
                </div>
              </div>
            </div>

            {/* Client Info */}
            {clientUser && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-headline-sm" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} style={{ color: 'var(--color-secondary-mid)' }} />
                    Posted by
                  </h3>
                </div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                  <Avatar name={clientUser.name} avatarUrl={clientUser.avatarUrl} size="md" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{clientUser.name}</div>
                    <Link to={`/profile/${clientUser.id}`} style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-secondary)', fontWeight: 600, display: 'inline-block', marginTop: '2px' }}>
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={withdrawConfirm}
        onClose={() => setWithdrawConfirm(false)}
        onConfirm={handleWithdraw}
        title="Withdraw your offer?"
        message="This will retract your offer from this task listing. The client will no longer see your offer, but you can submit a new one if you change your mind."
        confirmLabel="Withdraw Offer"
        confirmVariant="danger"
        isLoading={isLoading}
      />
      <ConfirmModal
        isOpen={!!updateStatusConfirm}
        onClose={() => setUpdateStatusConfirm(null)}
        onConfirm={handleUpdateStatus}
        title="Update job progress?"
        message={`This will transition the job status to "${updateStatusConfirm}". The client will be updated on your progress.`}
        confirmLabel="Confirm Update"
        isLoading={isLoading}
      />
      <Modal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        title="Clarify Task Details"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowQuestionModal(false)} disabled={isSubmittingQuestion}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAskQuestion}
              disabled={isSubmittingQuestion || !questionText.trim() || questionText.trim().length < 15}
            >
              {isSubmittingQuestion && <span className="spinner" style={{ width: '16px', height: '16px' }} />}
              Send Question
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--text-body-sm)', margin: 0 }}>
            Send a private inquiry to <strong>{clientUser?.name || 'the client'}</strong> regarding this task. They can accept your request to open a private conversation in Messages.
          </p>
          <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
            <label className="form-label required">Your Question</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="e.g. Is there parking available? Do I need to bring specialized cleaning equipment?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              style={{ resize: 'none', fontSize: 'var(--text-body-sm)', padding: '10px var(--space-3)' }}
              disabled={isSubmittingQuestion}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
              {questionText.trim().length < 15 
                ? `${15 - questionText.trim().length} more characters minimum`
                : 'Meets length requirements'
              }
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
