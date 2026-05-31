import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, AppAction, Task, Offer, Review, Notification, ChatRequest, ChatMessage, Conversation, User, UserRole } from '../types';
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

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

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
            offersCount: 0,
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

    fetchTasks();
    fetchUsers();
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


