import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, AppAction, Task, Offer, Review, Notification, ChatRequest, ChatMessage, Conversation, User, UserRole, WalletTransaction } from '../types';
import { MOCK_TASKS } from '../data/tasks';
import { MOCK_OFFERS } from '../data/offers';
import { MOCK_REVIEWS } from '../data/reviews';
import { MOCK_USERS } from '../data/users';
import {
  MOCK_NOTIFICATIONS,
  MOCK_WALLET_TRANSACTIONS,
  MOCK_CONVERSATIONS,
  MOCK_CHAT_REQUESTS,
  MOCK_CHAT_MESSAGES,
} from '../data/notifications';
import { generateId } from '../utils/formatters';
import { supabase } from '../utils/supabaseClient';

const initialState: AppState = {
  users: MOCK_USERS,
  tasks: MOCK_TASKS,
  offers: MOCK_OFFERS,
  reviews: MOCK_REVIEWS,
  notifications: MOCK_NOTIFICATIONS,
  walletTransactions: MOCK_WALLET_TRANSACTIONS,
  conversations: MOCK_CONVERSATIONS,
  chatRequests: MOCK_CHAT_REQUESTS,
  chatMessages: MOCK_CHAT_MESSAGES,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };

    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };

    case 'SET_OFFERS':
      return {
        ...state,
        offers: action.payload,
      };

    case 'SET_REVIEWS':
      return {
        ...state,
        reviews: action.payload,
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };

    case 'SET_WALLET_TRANSACTIONS':
      return {
        ...state,
        walletTransactions: action.payload,
      };

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
      };

    case 'SET_CHAT_REQUESTS':
      return {
        ...state,
        chatRequests: action.payload,
      };

    case 'SET_CHAT_MESSAGES':
      return {
        ...state,
        chatMessages: action.payload,
      };

    case 'CREATE_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };

    case 'CANCEL_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, status: 'cancelled' as const }
            : t
        ),
      };

    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId
            ? { ...t, status: action.payload.status }
            : t
        ),
      };

    case 'CREATE_OFFER': {
      const newOffer = action.payload;
      // Also update task offersCount and status
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === newOffer.taskId) {
          return {
            ...t,
            offersCount: t.offersCount + 1,
            status: t.status === 'open' ? ('receiving_offers' as const) : t.status,
          };
        }
        return t;
      });
      return {
        ...state,
        offers: [...state.offers, newOffer],
        tasks: updatedTasks,
      };
    }

    case 'UPDATE_OFFER':
      return {
        ...state,
        offers: state.offers.map((o) =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      };

    case 'ACCEPT_OFFER': {
      const { offerId, taskId, coTaskerId } = action.payload;
      const updatedOffers = state.offers.map((o) => {
        if (o.id === offerId) return { ...o, status: 'accepted' as const };
        if (o.taskId === taskId && o.id !== offerId) return { ...o, status: 'rejected' as const };
        return o;
      });
      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'assigned' as const, assignedCoTaskerId: coTaskerId }
          : t
      );
      // Add wallet reservation
      const acceptedOffer = state.offers.find((o) => o.id === offerId);
      const newTransaction = acceptedOffer
        ? {
            id: generateId('wallet'),
            taskId,
            clientId: state.tasks.find((t) => t.id === taskId)?.clientId ?? '',
            coTaskerId,
            amount: acceptedOffer.price,
            status: 'reserved' as const,
            createdAt: new Date().toISOString(),
          }
        : null;
      return {
        ...state,
        offers: updatedOffers,
        tasks: updatedTasks,
        walletTransactions: newTransaction
          ? [...state.walletTransactions, newTransaction]
          : state.walletTransactions,
      };
    }

    case 'WITHDRAW_OFFER':
      return {
        ...state,
        offers: state.offers.map((o) =>
          o.id === action.payload.offerId ? { ...o, status: 'withdrawn' as const } : o
        ),
      };

    case 'ADD_REVIEW':
      return {
        ...state,
        reviews: [...state.reviews, action.payload],
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.notificationId ? { ...n, isRead: true } : n
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === action.payload.userId ? { ...n, isRead: true } : n
        ),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case 'CREATE_CHAT_REQUEST':
      return {
        ...state,
        chatRequests: [action.payload, ...state.chatRequests],
      };

    case 'RESPOND_CHAT_REQUEST': {
      const { requestId, status, conversation, systemMessage } = action.payload;
      
      if (status === 'declined') {
        return {
          ...state,
          chatRequests: state.chatRequests.filter((r) => r.id !== requestId),
        };
      }

      const updatedRequests = state.chatRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      );
      
      let nextConversations = state.conversations;
      let nextMessages = state.chatMessages;

      if (conversation && !state.conversations.some((c) => c.id === conversation.id)) {
        nextConversations = [conversation, ...state.conversations];
      }
      if (systemMessage) {
        nextMessages = [...state.chatMessages, systemMessage];
      }

      return {
        ...state,
        chatRequests: updatedRequests,
        conversations: nextConversations,
        chatMessages: nextMessages,
      };
    }

    case 'SEND_CHAT_MESSAGE': {
      const msg = action.payload;
      const updatedConvs = state.conversations.map((c) =>
        c.id === msg.conversationId
          ? {
              ...c,
              lastMessage: msg.text,
              lastMessageAt: msg.createdAt,
            }
          : c
      );
      return {
        ...state,
        chatMessages: [...state.chatMessages, msg],
        conversations: updatedConvs,
      };
    }

    case 'CREATE_CONVERSATION':
      if (state.conversations.some((c) => c.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case 'APPLY_COTASKER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId ? { ...u, coTaskerStatus: 'pending' } : u
        ),
      };

    case 'APPROVE_COTASKER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId
            ? { ...u, coTaskerStatus: 'approved', role: 'cotasker' }
            : u
        ),
      };

    case 'REJECT_COTASKER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId ? { ...u, coTaskerStatus: 'rejected' } : u
        ),
      };

    case 'APPROVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId ? { ...t, moderationStatus: 'approved' } : t
        ),
      };

    case 'REJECT_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.taskId ? { ...t, moderationStatus: 'rejected' } : t
        ),
      };

    case 'DISABLE_USER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId ? { ...u, isDisabled: true } : u
        ),
      };

    case 'ENABLE_USER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId ? { ...u, isDisabled: false } : u
        ),
      };

    case 'TOGGLE_USER_COTASKER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId
            ? {
                ...u,
                role: action.payload.shouldBeCoTasker ? 'cotasker' : 'client',
                coTaskerStatus: action.payload.shouldBeCoTasker ? 'approved' : 'none',
              }
            : u
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.taskId),
      };

    case 'UPSERT_TASK': {
      const task = action.payload;
      const exists = state.tasks.some((t) => t.id === task.id);
      return {
        ...state,
        tasks: exists
          ? state.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t))
          : [task, ...state.tasks],
      };
    }

    case 'UPSERT_USER': {
      const user = action.payload;
      const exists = state.users.some((u) => u.id === user.id);
      return {
        ...state,
        users: exists
          ? state.users.map((u) => (u.id === user.id ? { ...u, ...user } : u))
          : [user, ...state.users],
      };
    }

    case 'UPSERT_OFFER': {
      const offer = action.payload;
      const exists = state.offers.some((o) => o.id === offer.id);
      return {
        ...state,
        offers: exists
          ? state.offers.map((o) => (o.id === offer.id ? { ...o, ...offer } : o))
          : [...state.offers, offer],
      };
    }

    case 'UPSERT_NOTIFICATION': {
      const notif = action.payload;
      const exists = state.notifications.some((n) => n.id === notif.id);
      return {
        ...state,
        notifications: exists
          ? state.notifications.map((n) => (n.id === notif.id ? { ...n, ...notif } : n))
          : [notif, ...state.notifications],
      };
    }

    case 'UPSERT_CONVERSATION': {
      const conv = action.payload;
      const exists = state.conversations.some((c) => c.id === conv.id);
      return {
        ...state,
        conversations: exists
          ? state.conversations.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
          : [conv, ...state.conversations],
      };
    }

    case 'UPSERT_CHAT_REQUEST': {
      const req = action.payload;
      const exists = state.chatRequests.some((r) => r.id === req.id);
      return {
        ...state,
        chatRequests: exists
          ? state.chatRequests.map((r) => (r.id === req.id ? { ...r, ...req } : r))
          : [req, ...state.chatRequests],
      };
    }

    case 'UPSERT_CHAT_MESSAGE': {
      const msg = action.payload;
      const exists = state.chatMessages.some((m) => m.id === msg.id);
      return {
        ...state,
        chatMessages: exists
          ? state.chatMessages.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
          : [...state.chatMessages, msg],
      };
    }

    case 'UPSERT_WALLET_TRANSACTION': {
      const tx = action.payload;
      const exists = state.walletTransactions.some((t) => t.id === tx.id);
      return {
        ...state,
        walletTransactions: exists
          ? state.walletTransactions.map((t) => (t.id === tx.id ? { ...t, ...tx } : t))
          : [...state.walletTransactions, tx],
      };
    }

    case 'UPSERT_REVIEW': {
      const rev = action.payload;
      const exists = state.reviews.some((r) => r.id === rev.id);
      return {
        ...state,
        reviews: exists
          ? state.reviews.map((r) => (r.id === rev.id ? { ...r, ...rev } : r))
          : [...state.reviews, rev],
      };
    }

    case 'REMOVE_OFFER':
      return {
        ...state,
        offers: state.offers.filter((o) => o.id !== action.payload.offerId),
      };

    case 'REMOVE_CHAT_REQUEST':
      return {
        ...state,
        chatRequests: state.chatRequests.filter((r) => r.id !== action.payload.requestId),
      };

    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.payload.conversationId),
      };

    case 'REMOVE_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: state.chatMessages.filter((m) => m.id !== action.payload.messageId),
      };

    case 'REMOVE_WALLET_TRANSACTION':
      return {
        ...state,
        walletTransactions: state.walletTransactions.filter((t) => t.id !== action.payload.transactionId),
      };

    case 'REMOVE_REVIEW':
      return {
        ...state,
        reviews: state.reviews.filter((r) => r.id !== action.payload.reviewId),
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

const mapTask = (t: any): Task => ({
  id: t.id,
  title: t.title,
  description: t.description,
  category: t.category,
  taskType: t.location === 'Remote' ? 'remote' : 'in_person',
  location: t.location,
  address: t.address,
  date: t.date,
  time: t.time || undefined,
  budgetType: t.budget_type,
  budget: t.budget || undefined,
  images: t.images || [],
  mustHaves: t.must_haves || [],
  clientId: t.client_id,
  assignedCoTaskerId: t.assigned_cotasker_id || undefined,
  status: t.status,
  createdAt: t.created_at,
  offersCount: t.offers_count || 0,
  moderationStatus: t.moderation_status,
});

const mapUser = (u: any): User => ({
  id: u.id,
  email: u.email,
  role: u.role as UserRole,
  name: u.name,
  avatarUrl: u.avatar_url || undefined,
  coTaskerStatus: u.co_tasker_status || 'none',
  isDisabled: u.is_disabled,
  createdAt: u.created_at,
  password: '',
});

const mapOffer = (o: any): Offer => ({
  id: o.id,
  taskId: o.task_id,
  coTaskerId: o.cotasker_id,
  price: Number(o.price),
  message: o.message,
  estimatedHours: o.estimated_hours,
  status: o.status,
  createdAt: o.created_at,
});

const mapNotification = (n: any): Notification => ({
  id: n.id,
  userId: n.user_id,
  type: n.type,
  title: n.title,
  message: n.message,
  isRead: n.is_read,
  linkTo: n.link_to || undefined,
  createdAt: n.created_at,
});

const mapWalletTransaction = (w: any): WalletTransaction => ({
  id: w.id,
  taskId: w.task_id,
  clientId: w.client_id,
  coTaskerId: w.cotasker_id || undefined,
  amount: Number(w.amount),
  status: w.status,
  createdAt: w.created_at,
});

const mapReview = (r: any): Review => ({
  id: r.id,
  taskId: r.task_id,
  fromUserId: r.from_user_id,
  toUserId: r.to_user_id,
  rating: r.rating,
  comment: r.comment,
  createdAt: r.created_at,
});

const mapConversation = (c: any): Conversation => ({
  id: c.id,
  participantIds: Array.isArray(c.participant_ids)
    ? c.participant_ids
    : JSON.parse(c.participant_ids || '[]'),
  lastMessage: c.last_message || undefined,
  lastMessageAt: c.last_message_at,
  unreadCount: c.unread_count,
  taskId: c.task_id || undefined,
});

const mapChatRequest = (cr: any): ChatRequest => ({
  id: cr.id,
  taskId: cr.task_id,
  senderId: cr.sender_id,
  receiverId: cr.receiver_id,
  question: cr.question,
  status: cr.status,
  createdAt: cr.created_at,
});

const mapChatMessage = (m: any): ChatMessage => ({
  id: m.id,
  conversationId: m.conversation_id,
  senderId: m.sender_id,
  text: m.text,
  createdAt: m.created_at,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedTasks: Task[] = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            taskType: t.location === 'Remote' ? 'remote' : 'in_person',
            location: t.location,
            address: t.address,
            date: t.date,
            time: t.time || undefined,
            budgetType: t.budget_type,
            budget: t.budget || undefined,
            images: t.images || [],
            mustHaves: t.must_haves || [],
            clientId: t.client_id,
            assignedCoTaskerId: t.assigned_cotasker_id || undefined,
            status: t.status,
            createdAt: t.created_at,
            offersCount: t.offers_count || 0,
            moderationStatus: t.moderation_status,
          }));

          // Merge db tasks and non-conflicting mock tasks
          const existingIds = new Set(mappedTasks.map((t) => t.id));
          const nonDuplicateMocks = MOCK_TASKS.filter((t) => !existingIds.has(t.id));

          dispatch({ type: 'SET_TASKS', payload: [...mappedTasks, ...nonDuplicateMocks] });
        }
      } catch (err) {
        console.error('Error loading tasks from Supabase:', err);
      }
    }

    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedUsers: User[] = data.map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.role as UserRole,
            name: u.name,
            avatarUrl: u.avatar_url || undefined,
            coTaskerStatus: u.co_tasker_status || 'none',
            isDisabled: u.is_disabled,
            createdAt: u.created_at,
            password: '',
          }));

          // Merge db users and non-conflicting mock users
          const existingIds = new Set(mappedUsers.map((u) => u.id));
          const nonDuplicateMocks = MOCK_USERS.filter((u) => !existingIds.has(u.id));

          dispatch({ type: 'SET_USERS', payload: [...mappedUsers, ...nonDuplicateMocks] });
        }
      } catch (err) {
        console.error('Error loading users from Supabase:', err);
      }
    }

    async function fetchUserScopedData(userId: string) {
      try {
        // 1. Fetch Offers
        const { data: dbOffers } = await supabase
          .from('offers')
          .select('*');

        if (dbOffers) {
          const mappedOffers: Offer[] = dbOffers.map((o: any) => ({
            id: o.id,
            taskId: o.task_id,
            coTaskerId: o.cotasker_id,
            price: Number(o.price),
            message: o.message,
            estimatedHours: o.estimated_hours,
            status: o.status,
            createdAt: o.created_at,
          }));
          const existingIds = new Set(mappedOffers.map((o) => o.id));
          const nonDuplicateMocks = MOCK_OFFERS.filter((o) => !existingIds.has(o.id));
          dispatch({ type: 'SET_OFFERS', payload: [...mappedOffers, ...nonDuplicateMocks] });
        }

        // 2. Fetch Notifications
        const { data: dbNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (dbNotifications) {
          const mappedNotifications: Notification[] = dbNotifications.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            linkTo: n.link_to || undefined,
            createdAt: n.created_at,
          }));
          const existingIds = new Set(mappedNotifications.map((n) => n.id));
          const nonDuplicateMocks = MOCK_NOTIFICATIONS.filter(
            (n) => n.userId === userId && !existingIds.has(n.id)
          );
          dispatch({
            type: 'SET_NOTIFICATIONS',
            payload: [...mappedNotifications, ...nonDuplicateMocks],
          });
        }

        // 3. Fetch Wallet Transactions
        const { data: dbTransactions } = await supabase
          .from('wallet_transactions')
          .select('*');

        if (dbTransactions) {
          const mappedTransactions: WalletTransaction[] = dbTransactions.map((t: any) => ({
            id: t.id,
            taskId: t.task_id,
            clientId: t.client_id,
            coTaskerId: t.cotasker_id || undefined,
            amount: Number(t.amount),
            status: t.status,
            createdAt: t.created_at,
          }));
          const existingIds = new Set(mappedTransactions.map((t) => t.id));
          const nonDuplicateMocks = MOCK_WALLET_TRANSACTIONS.filter((t) => !existingIds.has(t.id));
          dispatch({
            type: 'SET_WALLET_TRANSACTIONS',
            payload: [...mappedTransactions, ...nonDuplicateMocks],
          });
        }

        // 4. Fetch Reviews
        const { data: dbReviews } = await supabase
          .from('reviews')
          .select('*');

        if (dbReviews) {
          const mappedReviews: Review[] = dbReviews.map((r: any) => ({
            id: r.id,
            taskId: r.task_id,
            fromUserId: r.from_user_id,
            toUserId: r.to_user_id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at,
          }));
          const existingIds = new Set(mappedReviews.map((r) => r.id));
          const nonDuplicateMocks = MOCK_REVIEWS.filter((r) => !existingIds.has(r.id));
          dispatch({ type: 'SET_REVIEWS', payload: [...mappedReviews, ...nonDuplicateMocks] });
        }

        // 5. Fetch Conversations
        const { data: dbConversations } = await supabase
          .from('conversations')
          .select('*');

        if (dbConversations) {
          const mappedConversations: Conversation[] = dbConversations.map((c: any) => ({
            id: c.id,
            participantIds: Array.isArray(c.participant_ids)
              ? c.participant_ids
              : JSON.parse(c.participant_ids || '[]'),
            lastMessage: c.last_message || undefined,
            lastMessageAt: c.last_message_at,
            unreadCount: c.unread_count,
            taskId: c.task_id || undefined,
          }));
          const existingIds = new Set(mappedConversations.map((c) => c.id));
          const nonDuplicateMocks = MOCK_CONVERSATIONS.filter((c) => !existingIds.has(c.id));
          dispatch({
            type: 'SET_CONVERSATIONS',
            payload: [...mappedConversations, ...nonDuplicateMocks],
          });
        }

        // 6. Fetch Chat Requests
        const { data: dbChatRequests } = await supabase
          .from('chat_requests')
          .select('*');

        if (dbChatRequests) {
          const mappedChatRequests: ChatRequest[] = dbChatRequests.map((cr: any) => ({
            id: cr.id,
            taskId: cr.task_id,
            senderId: cr.sender_id,
            receiverId: cr.receiver_id,
            question: cr.question,
            status: cr.status,
            createdAt: cr.created_at,
          }));
          const existingIds = new Set(mappedChatRequests.map((cr) => cr.id));
          const nonDuplicateMocks = MOCK_CHAT_REQUESTS.filter((cr) => !existingIds.has(cr.id));
          dispatch({
            type: 'SET_CHAT_REQUESTS',
            payload: [...mappedChatRequests, ...nonDuplicateMocks],
          });
        }

        // 7. Fetch Chat Messages
        const { data: dbChatMessages } = await supabase
          .from('chat_messages')
          .select('*');

        if (dbChatMessages) {
          const mappedChatMessages: ChatMessage[] = dbChatMessages.map((m: any) => ({
            id: m.id,
            conversationId: m.conversation_id,
            senderId: m.sender_id,
            text: m.text,
            createdAt: m.created_at,
          }));
          const existingIds = new Set(mappedChatMessages.map((m) => m.id));
          const nonDuplicateMocks = MOCK_CHAT_MESSAGES.filter((m) => !existingIds.has(m.id));
          dispatch({
            type: 'SET_CHAT_MESSAGES',
            payload: [...mappedChatMessages, ...nonDuplicateMocks],
          });
        }
      } catch (err) {
        console.error('Error loading session-scoped data from Supabase:', err);
      }
    }

    fetchTasks();
    fetchUsers();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        fetchUserScopedData(session.user.id);
      } else {
        // Reset user-scoped lists when logged out
        dispatch({ type: 'SET_OFFERS', payload: [] });
        dispatch({ type: 'SET_REVIEWS', payload: [] });
        dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
        dispatch({ type: 'SET_WALLET_TRANSACTIONS', payload: [] });
        dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
        dispatch({ type: 'SET_CHAT_REQUESTS', payload: [] });
        dispatch({ type: 'SET_CHAT_MESSAGES', payload: [] });
      }
    });

    // Run initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserScopedData(session.user.id);
      }
    });

    // Setup Realtime Postgres subscriptions
    const realtimeChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_TASK', payload: { taskId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_TASK', payload: mapTask(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          dispatch({ type: 'UPSERT_USER', payload: mapUser(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_OFFER', payload: { offerId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_OFFER', payload: mapOffer(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          // No remove notification action needed
        } else {
          dispatch({ type: 'UPSERT_NOTIFICATION', payload: mapNotification(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_CONVERSATION', payload: { conversationId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_CONVERSATION', payload: mapConversation(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_CHAT_REQUEST', payload: { requestId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_CHAT_REQUEST', payload: mapChatRequest(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_CHAT_MESSAGE', payload: { messageId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_CHAT_MESSAGE', payload: mapChatMessage(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_WALLET_TRANSACTION', payload: { transactionId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_WALLET_TRANSACTION', payload: mapWalletTransaction(payload.new) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_REVIEW', payload: { reviewId: payload.old.id } });
        } else {
          dispatch({ type: 'UPSERT_REVIEW', payload: mapReview(payload.new) });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      realtimeChannel.unsubscribe();
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// Typed action creators
export function createTaskAction(task: Task): AppAction {
  return { type: 'CREATE_TASK', payload: task };
}

export function createOfferAction(offer: Offer): AppAction {
  return { type: 'CREATE_OFFER', payload: offer };
}

export function acceptOfferAction(offerId: string, taskId: string, coTaskerId: string): AppAction {
  return { type: 'ACCEPT_OFFER', payload: { offerId, taskId, coTaskerId } };
}

export function withdrawOfferAction(offerId: string): AppAction {
  return { type: 'WITHDRAW_OFFER', payload: { offerId } };
}

export function updateTaskStatusAction(taskId: string, status: Task['status']): AppAction {
  return { type: 'UPDATE_TASK_STATUS', payload: { taskId, status } };
}

export function addReviewAction(review: Review): AppAction {
  return { type: 'ADD_REVIEW', payload: review };
}

export function addNotificationAction(notification: Notification): AppAction {
  return { type: 'ADD_NOTIFICATION', payload: notification };
}

export function markNotificationReadAction(notificationId: string): AppAction {
  return { type: 'MARK_NOTIFICATION_READ', payload: { notificationId } };
}

export function markAllNotificationsReadAction(userId: string): AppAction {
  return { type: 'MARK_ALL_NOTIFICATIONS_READ', payload: { userId } };
}

export function createChatRequestAction(request: ChatRequest): AppAction {
  return { type: 'CREATE_CHAT_REQUEST', payload: request };
}

export function respondChatRequestAction(
  requestId: string,
  status: 'accepted' | 'declined',
  conversation?: Conversation,
  systemMessage?: ChatMessage
): AppAction {
  return {
    type: 'RESPOND_CHAT_REQUEST',
    payload: { requestId, status, conversation, systemMessage }
  };
}

export function sendChatMessageAction(message: ChatMessage): AppAction {
  return { type: 'SEND_CHAT_MESSAGE', payload: message };
}

export function createConversationAction(conversation: Conversation): AppAction {
  return { type: 'CREATE_CONVERSATION', payload: conversation };
}

export function applyCoTaskerAction(userId: string): AppAction {
  return { type: 'APPLY_COTASKER', payload: { userId } };
}

export function approveCoTaskerAction(userId: string): AppAction {
  return { type: 'APPROVE_COTASKER', payload: { userId } };
}

export function rejectCoTaskerAction(userId: string): AppAction {
  return { type: 'REJECT_COTASKER', payload: { userId } };
}

export function approveTaskAction(taskId: string): AppAction {
  return { type: 'APPROVE_TASK', payload: { taskId } };
}

export function rejectTaskAction(taskId: string): AppAction {
  return { type: 'REJECT_TASK', payload: { taskId } };
}

export function disableUserAction(userId: string): AppAction {
  return { type: 'DISABLE_USER', payload: { userId } };
}

export function enableUserAction(userId: string): AppAction {
  return { type: 'ENABLE_USER', payload: { userId } };
}

export function toggleUserCoTaskerAction(userId: string, shouldBeCoTasker: boolean): AppAction {
  return { type: 'TOGGLE_USER_COTASKER', payload: { userId, shouldBeCoTasker } };
}

export function deleteTaskAction(taskId: string): AppAction {
  return { type: 'DELETE_TASK', payload: { taskId } };
}


