import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, Send, AlertCircle, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  useAppContext, 
  sendChatMessageAction, 
  respondChatRequestAction,
  acceptOfferAction 
} from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { formatCurrency, generateId } from '../../utils/formatters';
import { CoTaskerProfileDrawer } from '../../components/profile/CoTaskerProfileDrawer';
import { useTranslation } from '../../context/LanguageContext';
import { supabase } from '../../utils/supabaseClient';

export function MessagesPage() {
  const { currentUser } = useAuth();
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedTaskerId, setSelectedTaskerId] = useState<string | null>(null);
  
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, state.chatMessages]);

  // Sync selection from query params (e.g. ?conv=id or ?req=id)
  useEffect(() => {
    const convId = searchParams.get('conv');
    const reqId = searchParams.get('req');
    
    if (convId) {
      setActiveTab('chats');
      setSelectedId(convId);
    } else if (reqId) {
      setActiveTab('requests');
      setSelectedId(reqId);
    }
  }, [searchParams]);

  if (!currentUser) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p>{t('messages.login_required')}</p>
      </div>
    );
  }

  // ─── Query Lists ───
  // Conversations where currentUser is a participant
  const activeConversations = state.conversations.filter((c) =>
    c.participantIds.includes(currentUser.id)
  );

  // Inbound pending chat requests (where currentUser is the client/receiver)
  const pendingRequests = state.chatRequests.filter((r) =>
    r.receiverId === currentUser.id && r.status === 'pending'
  );

  // Get active selected items
  const activeConversation = selectedId && activeTab === 'chats'
    ? state.conversations.find((c) => c.id === selectedId)
    : null;

  const activeRequest = selectedId && activeTab === 'requests'
    ? state.chatRequests.find((r) => r.id === selectedId)
    : null;

  // Selected participant / sender profiles
  const activeChatParticipant = activeConversation
    ? state.users.find((u) => u.id === activeConversation.participantIds.find((id) => id !== currentUser.id))
    : null;

  const activeRequestSender = activeRequest
    ? state.users.find((u) => u.id === activeRequest.senderId)
    : null;

  // Selected task
  const activeTask = activeConversation
    ? state.tasks.find((t) => t.id === activeConversation.taskId)
    : activeRequest
      ? state.tasks.find((t) => t.id === activeRequest.taskId)
      : null;

  // Active offer context (if tasker has bid on this task)
  const taskerId = activeConversation
    ? activeConversation.participantIds.find((id) => id !== currentUser.id)
    : activeRequest
      ? activeRequest.senderId
      : null;

  const activeOffer = activeTask && taskerId
    ? state.offers.find(
        (o) => o.taskId === activeTask.id && o.coTaskerId === taskerId && o.status !== 'withdrawn'
      )
    : null;

  // Active message stream
  const activeMessages = activeConversation
    ? state.chatMessages.filter((m) => m.conversationId === activeConversation.id)
    : [];

  // ─── Handlers ───
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    const newMessage = {
      id: generateId('msg'),
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      text: messageText.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const { error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          id: newMessage.id,
          conversation_id: newMessage.conversationId,
          sender_id: newMessage.senderId,
          text: newMessage.text,
          created_at: newMessage.createdAt
        });
      if (msgErr) throw msgErr;

      const { error: convErr } = await supabase
        .from('conversations')
        .update({
          last_message: newMessage.text,
          last_message_at: newMessage.createdAt
        })
        .eq('id', newMessage.conversationId);
      if (convErr) throw convErr;

      dispatch(sendChatMessageAction(newMessage));
      setMessageText('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const handleAcceptRequest = async () => {
    if (!activeRequest || !activeTask) return;

    const convId = generateId('conv');
    const conversation = {
      id: convId,
      participantIds: [activeRequest.senderId, activeRequest.receiverId],
      lastMessage: activeRequest.question,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      taskId: activeRequest.taskId
    };

    const systemMessage = {
      id: generateId('msg'),
      conversationId: convId,
      senderId: activeRequest.senderId,
      text: `${t('messages.inquiry_req_prefix')}"${activeRequest.question}"`,
      createdAt: activeRequest.createdAt
    };

    try {
      const { error: convErr } = await supabase
        .from('conversations')
        .insert({
          id: conversation.id,
          participant_ids: conversation.participantIds,
          last_message: conversation.lastMessage,
          last_message_at: conversation.lastMessageAt,
          unread_count: conversation.unreadCount,
          task_id: conversation.taskId
        });
      if (convErr) throw convErr;

      const { error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          id: systemMessage.id,
          conversation_id: systemMessage.conversationId,
          sender_id: systemMessage.senderId,
          text: systemMessage.text,
          created_at: systemMessage.createdAt
        });
      if (msgErr) throw msgErr;

      const { error: reqErr } = await supabase
        .from('chat_requests')
        .update({ status: 'accepted' })
        .eq('id', activeRequest.id);
      if (reqErr) throw reqErr;

      dispatch(respondChatRequestAction(activeRequest.id, 'accepted', conversation, systemMessage));
      showToast(t('messages.toast_accepted'), 'success');
      
      // Switch tabs and select the new chat room
      setSearchParams({ conv: convId });
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to accept request', 'error');
    }
  };

  const handleDeclineRequest = async () => {
    if (!activeRequest) return;
    try {
      const { error } = await supabase
        .from('chat_requests')
        .delete()
        .eq('id', activeRequest.id);
      if (error) throw error;

      dispatch(respondChatRequestAction(activeRequest.id, 'declined'));
      showToast(t('messages.toast_declined'), 'info');
      setSelectedId(null);
      setSearchParams({});
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to decline request', 'error');
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeOffer || !activeTask) return;
    try {
      // 1. Update accepted offer status
      const { error: acceptErr } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', activeOffer.id);
      if (acceptErr) throw acceptErr;

      // 2. Reject other offers
      const { error: rejectErr } = await supabase
        .from('offers')
        .update({ status: 'rejected' })
        .eq('task_id', activeTask.id)
        .neq('id', activeOffer.id);
      if (rejectErr) throw rejectErr;

      // 3. Update task
      const { error: taskErr } = await supabase
        .from('tasks')
        .update({ status: 'assigned', assigned_cotasker_id: activeOffer.coTaskerId })
        .eq('id', activeTask.id);
      if (taskErr) throw taskErr;

      // 4. Record wallet transaction
      const txId = generateId('wallet');
      const { error: walletErr } = await supabase
        .from('wallet_transactions')
        .insert({
          id: txId,
          task_id: activeTask.id,
          client_id: currentUser!.id,
          cotasker_id: activeOffer.coTaskerId,
          amount: activeOffer.price,
          status: 'reserved',
          created_at: new Date().toISOString()
        });
      if (walletErr) throw walletErr;

      // 5. Send notification to CoTasker
      const newNotif = {
        id: generateId('notif'),
        userId: activeOffer.coTaskerId,
        type: 'offer_accepted' as const,
        title: 'Your offer was accepted!',
        message: `Your offer for "${activeTask.title}" has been accepted. Check your jobs to get started.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        linkTo: '/my-tasks?tab=tasker',
      };

      await supabase
        .from('notifications')
        .insert({
          id: newNotif.id,
          user_id: newNotif.userId,
          type: newNotif.type,
          title: newNotif.title,
          message: newNotif.message,
          is_read: newNotif.isRead,
          created_at: newNotif.createdAt,
          link_to: newNotif.linkTo
        });

      dispatch(acceptOfferAction(activeOffer.id, activeTask.id, activeOffer.coTaskerId));
      showToast(t('messages.toast_offer_accepted'), 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to accept offer', 'error');
    }
  };

  // Helper to find username by ID
  const getUserName = (id: string) => {
    if (id === currentUser.id) return t('messages.you');
    return state.users.find((u) => u.id === id)?.name || t('messages.user');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 1px)', background: 'var(--color-surface)', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR PANEL: Tabs & Thread Lists */}
      <div style={{
        width: '340px',
        borderRight: '1px solid var(--color-outline-variant)',
        background: 'var(--color-surface-white)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-outline-variant)' }}>
          <h1 className="text-headline-md" style={{ margin: 0, fontWeight: 700 }}>{t('messages.title')}</h1>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '11px', margin: '4px 0 0 0' }}>
            {t('messages.subtitle')}
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-outline-variant)' }}>
          <button
            onClick={() => { setActiveTab('chats'); setSelectedId(null); setSearchParams({}); }}
            style={{
              flex: 1,
              padding: '14px 0',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'chats' ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
              borderBottom: activeTab === 'chats' ? '2.5px solid var(--color-primary)' : 'none',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {t('messages.tab_chats')}
            {activeConversations.length > 0 && (
              <span style={{ fontSize: '10px', background: 'var(--color-surface-container-high)', padding: '2px 6px', borderRadius: '10px' }}>
                {activeConversations.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('requests'); setSelectedId(null); setSearchParams({}); }}
            style={{
              flex: 1,
              padding: '14px 0',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'requests' ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
              borderBottom: activeTab === 'requests' ? '2.5px solid var(--color-primary)' : 'none',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {t('messages.tab_inquiries')}
            {pendingRequests.length > 0 && (
              <span style={{ fontSize: '10px', background: 'var(--color-primary)', color: 'var(--color-secondary)', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* THREAD LIST */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'chats' ? (
            activeConversations.length > 0 ? (
              activeConversations.map((c) => {
                const isSelected = selectedId === c.id;
                const participant = state.users.find((u) => u.id === c.participantIds.find((id) => id !== currentUser.id));
                const task = state.tasks.find((t) => t.id === c.taskId);
                
                return (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedId(c.id); setSearchParams({ conv: c.id }); }}
                    style={{
                      padding: 'var(--space-4) var(--space-5)',
                      borderBottom: '1px solid var(--color-outline-variant)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-surface-container-low)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <Avatar name={participant?.name || 'User'} avatarUrl={participant?.avatarUrl} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-secondary)' }}>
                          {participant?.name || 'User'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      
                      {task && (
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary-mid)', margin: '2px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          📋 {task.title}
                        </div>
                      )}

                      <p style={{
                        fontSize: '12px',
                        color: 'var(--color-on-surface-variant)',
                        margin: 0,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {c.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-on-surface-variant)' }}>
                <MessageSquare size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{t('messages.no_conversations')}</div>
                <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>{t('messages.no_conversations_desc')}</p>
              </div>
            )
          ) : (
            pendingRequests.length > 0 ? (
              pendingRequests.map((r) => {
                const isSelected = selectedId === r.id;
                const sender = state.users.find((u) => u.id === r.senderId);
                const task = state.tasks.find((t) => t.id === r.taskId);
                
                return (
                  <div
                    key={r.id}
                    onClick={() => { setSelectedId(r.id); setSearchParams({ req: r.id }); }}
                    style={{
                      padding: 'var(--space-4) var(--space-5)',
                      borderBottom: '1px solid var(--color-outline-variant)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-surface-container-low)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <Avatar name={sender?.name || 'User'} avatarUrl={sender?.avatarUrl} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-secondary)' }}>
                          {sender?.name || 'User'}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', fontWeight: 600, background: 'var(--color-primary)', padding: '1px 5px', borderRadius: '4px' }}>
                          NEW
                        </span>
                      </div>
                      
                      {task && (
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary-mid)', margin: '2px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Inquiry: {task.title}
                        </div>
                      )}

                      <p style={{
                        fontSize: '12px',
                        color: 'var(--color-on-surface-variant)',
                        margin: 0,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {r.question}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-on-surface-variant)' }}>
                <AlertCircle size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{t('messages.no_inquiries')}</div>
                <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>{t('messages.no_inquiries_desc')}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* RIGHT DISPLAY PANEL: Detailed Inquiry Review or Chat stream */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface-white)' }}>
        
        {/* Scenario 1: Select Active Chat Room */}
        {activeTab === 'chats' && activeConversation ? (
          <>
            {/* Chat header */}
            <div style={{
              padding: 'var(--space-4) var(--space-6)',
              borderBottom: '1px solid var(--color-outline-variant)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface-white)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  onClick={() => {
                    if (activeChatParticipant?.role === 'cotasker') {
                      setSelectedTaskerId(activeChatParticipant.id);
                    }
                  }}
                  style={{ 
                    cursor: activeChatParticipant?.role === 'cotasker' ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <Avatar name={activeChatParticipant?.name || 'User'} avatarUrl={activeChatParticipant?.avatarUrl} size="md" />
                  <div>
                    <div style={{ 
                      fontWeight: 700, 
                      color: 'var(--color-secondary)', 
                      fontSize: '14px',
                      textDecoration: activeChatParticipant?.role === 'cotasker' ? 'underline decoration-transparent hover:decoration-primary' : 'none'
                    }} className="hover-underline">
                      {activeChatParticipant?.name}
                    </div>
                    {activeTask && (
                      <Link 
                        to={`/tasks/${activeTask.id}`} 
                        onClick={(e) => e.stopPropagation()} // prevent opening profile drawer
                        style={{ fontSize: '11px', color: 'var(--color-secondary-mid)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        <strong>{t('messages.regarding')}</strong> {activeTask.title} <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual Offer Banner */}
            {activeTask && activeOffer && (
              <div style={{
                background: 'var(--color-surface-container-low)',
                borderBottom: '1px solid var(--color-outline-variant)',
                padding: 'var(--space-3) var(--space-6)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-secondary)' }}>
                    🏷️ {t('messages.active_bid')} <strong style={{ fontSize: '15px', color: 'var(--color-secondary)' }}>{formatCurrency(activeOffer.price)}</strong>
                  </span>
                  <span className="chip" style={{ fontSize: '10px' }}>
                    {activeOffer.status === 'accepted' ? t('messages.status_hired') : t('messages.status_pending')}
                  </span>
                </div>
                {activeTask.clientId === currentUser.id && activeOffer.status === 'pending' && (
                  <button className="btn btn-primary btn-sm" onClick={handleAcceptOffer}>
                    {t('messages.accept_and_hire')}
                  </button>
                )}
                {activeOffer.coTaskerId === currentUser.id && (
                  <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
                    {t('messages.waiting_decision')}
                  </span>
                )}
              </div>
            )}

            {/* Chat message streams */}
            <div style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto', background: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeMessages.map((m) => {
                  const isCurrentUser = m.senderId === currentUser.id;
                  
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)', marginBottom: '2px', padding: '0 4px' }}>
                        {getUserName(m.senderId)}
                      </span>
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        borderTopRightRadius: isCurrentUser ? '2px' : '12px',
                        borderTopLeftRadius: !isCurrentUser ? '2px' : '12px',
                        background: isCurrentUser ? 'var(--color-secondary)' : 'var(--color-on-surface)',
                        color: isCurrentUser ? '#ffffff' : 'var(--color-on-surface)',
                        border: isCurrentUser ? 'none' : '1px solid var(--color-outline-variant)',
                        fontSize: 'var(--text-body-sm)',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {m.text}
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--color-on-surface-variant)', marginTop: '2px', opacity: 0.7, padding: '0 4px' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            </div>

            {/* Chat room message input footer */}
            {activeTask && (activeTask.status === 'open' || activeTask.status === 'receiving_offers' || activeTask.assignedCoTaskerId === taskerId) ? (
              <form onSubmit={handleSendMessage} style={{
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--color-outline-variant)',
                display: 'flex',
                gap: '12px',
                background: 'var(--color-surface-white)'
              }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('chat.type_message')}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '10px 16px', fontSize: 'var(--text-body-sm)' }}
                />
                <button type="submit" className="btn btn-secondary btn-icon" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div style={{
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface-container-low)',
                textAlign: 'center',
                color: 'var(--color-on-surface-variant)',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertTriangle size={14} style={{ color: 'var(--color-status-warning)' }} />
                {t('messages.read_only_msg')}
              </div>
            )}
          </>
        ) : activeTab === 'requests' && activeRequest ? (
          
          /* Scenario 2: Preview Pending Chat Request */
          <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', overflowY: 'auto' }}>
            <div className="card" style={{ maxWidth: '520px', width: '100%', padding: 'var(--space-6)' }}>
              <div 
                onClick={() => {
                  if (activeRequestSender?.role === 'cotasker') {
                    setSelectedTaskerId(activeRequestSender.id);
                  }
                }}
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center', 
                  borderBottom: '1px solid var(--color-outline-variant)', 
                  paddingBottom: '16px', 
                  marginBottom: '20px',
                  cursor: activeRequestSender?.role === 'cotasker' ? 'pointer' : 'default'
                }}
              >
                <Avatar name={activeRequestSender?.name || 'User'} avatarUrl={activeRequestSender?.avatarUrl} size="lg" />
                <div>
                  <span className="chip" style={{ fontSize: '10px', background: 'var(--color-primary-container)', color: 'var(--color-secondary)', fontWeight: 700, marginBottom: '4px', display: 'inline-block' }}>
                    {t('messages.clarification_request')}
                  </span>
                  <h2 className="text-headline-sm hover-underline" style={{ 
                    margin: 0, 
                    fontWeight: 700, 
                    fontSize: '16px',
                    textDecoration: activeRequestSender?.role === 'cotasker' ? 'underline decoration-transparent hover:decoration-primary' : 'none'
                  }}>
                    {t('messages.inquiry_from')} {activeRequestSender?.name}
                  </h2>
                </div>
              </div>

              {activeTask && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', marginBottom: '4px' }}>{t('messages.task_details')}</div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {activeTask.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                    <span>📍 {activeTask.location}</span>
                    <span>💶 {activeTask.budgetType === 'open_to_offers' ? t('messages.open_bids') : `${formatCurrency(activeTask.budget || 0)}`}</span>
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--color-surface-container-low)', padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--color-secondary-mid)', marginBottom: '24px' }}>
                <p style={{ fontSize: 'var(--text-body-sm)', fontStyle: 'italic', margin: 0, color: 'var(--color-secondary)', lineHeight: 1.5 }}>
                  "{activeRequest.question}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={handleDeclineRequest}>
                  {t('messages.decline_request')}
                </button>
                <button className="btn btn-primary" onClick={handleAcceptRequest}>
                  {t('messages.accept_and_chat')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          
          /* Scenario 3: No Thread Selected (Default Empty State) */
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-on-surface-variant)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-surface)',
              border: '1.5px dashed var(--color-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              opacity: 0.6
            }}>
              <MessageSquare size={28} />
            </div>
            <h3 className="text-headline-sm" style={{ fontWeight: 700, margin: '0 0 6px 0', fontSize: '15px' }}>
              {t('messages.select_conversation')}
            </h3>
            <p style={{ fontSize: 'var(--text-body-sm)', margin: 0, opacity: 0.8 }}>
              {t('messages.select_conversation_desc')}
            </p>
          </div>
        )}
      </div>

      {/* Profile & Reviews Drawer */}
      <CoTaskerProfileDrawer 
        userId={selectedTaskerId}
        onClose={() => setSelectedTaskerId(null)}
      />
    </div>
  );
}
