export const ROUTES = {
  LOGIN: '/login',
  // Client
  CLIENT_DASHBOARD: '/client/dashboard',
  CLIENT_TASKS: '/client/tasks',
  CLIENT_TASK_NEW: '/client/tasks/new',
  CLIENT_TASK_DETAIL: '/client/tasks/:id',
  CLIENT_OFFERS: '/client/offers',
  // CoTasker
  COTASKER_DASHBOARD: '/cotasker/dashboard',
  COTASKER_TASKS: '/cotasker/tasks',
  COTASKER_TASK_DETAIL: '/cotasker/tasks/:id',
  COTASKER_MY_OFFERS: '/cotasker/my-offers',
  COTASKER_JOBS: '/cotasker/jobs',
  // Shared
  PROFILE: '/profile/:id',
  NOTIFICATIONS: '/notifications',
  MESSAGES: '/messages',
  SETTINGS: '/settings',
} as const;
