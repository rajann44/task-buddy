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
  coTaskerStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  isDisabled?: boolean;
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
  qualifications?: string[];
  languages?: string[];
  transport?: string;
  portfolio?: { title: string; imageUrl: string; description?: string }[];
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export type TaskCategory =
  | 'Cleaning'
  | 'Handy Person'
  | 'Furniture Assembly'
  | 'Transport & Removals'
  | 'Repairs'
  | 'Painting'
  | 'Electrical'
  | 'Plumbing'
  | 'Gardening & Plant Care'
  | 'Shopping'
  | 'Delivery'
  | 'Packing & Lifting'
  | 'Errands'
  | 'Pet Care'
  | 'Translation'
  | 'Photography'
  | 'Design'
  | 'Tutoring'
  | 'Online'
  | 'Cooking'
  | 'Events'
  | 'Personal Assistance'
  | 'Moving'
  | 'Custom / Other';

export type TaskStatus =
  | 'open'
  | 'receiving_offers'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type BudgetType = 'fixed' | 'hourly' | 'open_to_offers';

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
  taskType?: 'in_person' | 'remote';
  mustHaves?: string[];
  moderationStatus?: 'pending' | 'approved' | 'rejected';
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

export interface ChatRequest {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  question: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
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
  users: User[];
  tasks: Task[];
  offers: Offer[];
  reviews: Review[];
  notifications: Notification[];
  walletTransactions: WalletTransaction[];
  conversations: Conversation[];
  chatRequests: ChatRequest[];
  chatMessages: ChatMessage[];
}

export type AppAction =
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_TASKS'; payload: Task[] }
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
  | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; status: TaskStatus } }
  | { type: 'CREATE_CHAT_REQUEST'; payload: ChatRequest }
  | { type: 'RESPOND_CHAT_REQUEST'; payload: { requestId: string; status: 'accepted' | 'declined'; conversation?: Conversation; systemMessage?: ChatMessage } }
  | { type: 'SEND_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'APPLY_COTASKER'; payload: { userId: string } }
  | { type: 'APPROVE_COTASKER'; payload: { userId: string } }
  | { type: 'REJECT_COTASKER'; payload: { userId: string } }
  | { type: 'APPROVE_TASK'; payload: { taskId: string } }
  | { type: 'REJECT_TASK'; payload: { taskId: string } }
  | { type: 'DISABLE_USER'; payload: { userId: string } }
  | { type: 'ENABLE_USER'; payload: { userId: string } }
  | { type: 'TOGGLE_USER_COTASKER'; payload: { userId: string; shouldBeCoTasker: boolean } }
  | { type: 'DELETE_TASK'; payload: { taskId: string } };

