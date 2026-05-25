// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'client' | 'cotasker' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string; // plaintext for mock only
  role: UserRole;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ClientProfile {
  userId: string;
  bio?: string;
  location: string;
  tasksPosted: number;
  completedTasks: number;
  memberSince: string;
  isVerified: boolean;
  createdAt: string;
}

export interface CoTaskerProfile {
  userId: string;
  bio: string;
  skills: string[];
  categories: string[];
  location: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string; // e.g. "< 1 hour"
  memberSince: string;
  isVerified: boolean;
  isTopRated: boolean;
  isFastResponder: boolean;
  totalEarnings: number;
  availability: string;
  hourlyRate?: number;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export type TaskCategory =
  | 'Moving'
  | 'Cleaning'
  | 'Furniture Assembly'
  | 'Painting'
  | 'Repairs'
  | 'Delivery'
  | 'Personal Assistance';

export type TaskStatus =
  | 'open'
  | 'receiving_offers'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type BudgetType = 'fixed' | 'open_to_offers';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  location: string;
  address: string;
  date: string;
  time?: string;
  budgetType: BudgetType;
  budget?: number;
  images: string[];
  clientId: string;
  assignedCoTaskerId?: string;
  status: TaskStatus;
  createdAt: string;
  offersCount: number;
}

export interface TaskStatusHistory {
  taskId: string;
  status: TaskStatus;
  timestamp: string;
  note?: string;
}

// ─── Offers ─────────────────────────────────────────────────────────────────

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Offer {
  id: string;
  taskId: string;
  coTaskerId: string;
  price: number;
  message: string;
  estimatedHours: number;
  status: OfferStatus;
  createdAt: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_offer'
  | 'offer_accepted'
  | 'offer_withdrawn'
  | 'task_assigned'
  | 'task_completed'
  | 'new_review'
  | 'task_cancelled'
  | 'payment_released';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
}

// ─── Wallet / Payments (mocked) ───────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'reserved' | 'released' | 'refunded';

export interface WalletTransaction {
  id: string;
  taskId: string;
  clientId: string;
  coTaskerId?: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

// ─── Messages (UI-only mock) ──────────────────────────────────────────────────

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  taskId?: string;
}

// ─── Filter types ────────────────────────────────────────────────────────────

export interface TaskFilters {
  category?: TaskCategory | '';
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  status?: TaskStatus | '';
  search?: string;
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface AppState {
  tasks: Task[];
  offers: Offer[];
  reviews: Review[];
  notifications: Notification[];
  walletTransactions: WalletTransaction[];
  conversations: Conversation[];
}

export type AppAction =
  | { type: 'CREATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Partial<Task> & { id: string } }
  | { type: 'CANCEL_TASK'; payload: { taskId: string } }
  | { type: 'CREATE_OFFER'; payload: Offer }
  | { type: 'UPDATE_OFFER'; payload: Partial<Offer> & { id: string } }
  | { type: 'ACCEPT_OFFER'; payload: { offerId: string; taskId: string; coTaskerId: string } }
  | { type: 'WITHDRAW_OFFER'; payload: { offerId: string } }
  | { type: 'ADD_REVIEW'; payload: Review }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { notificationId: string } }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ'; payload: { userId: string } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; status: TaskStatus } };
