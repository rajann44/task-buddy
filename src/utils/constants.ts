export const TASK_CATEGORIES = [
  'Moving',
  'Cleaning',
  'Furniture Assembly',
  'Painting',
  'Repairs',
  'Delivery',
  'Personal Assistance',
] as const;

export const TASK_STATUSES = [
  'open',
  'receiving_offers',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  receiving_offers: 'Receiving Offers',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  open: 'status-open',
  receiving_offers: 'status-offers',
  assigned: 'status-assigned',
  in_progress: 'status-inprogress',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Moving': '📦',
  'Cleaning': '🧹',
  'Furniture Assembly': '🪑',
  'Painting': '🎨',
  'Repairs': '🔧',
  'Delivery': '🚚',
  'Personal Assistance': '🤝',
};

export const AUSTRALIAN_CITIES = ['Berlin', 'Hamburg', 'Munich', 'Frankfurt', 'Cologne'];
