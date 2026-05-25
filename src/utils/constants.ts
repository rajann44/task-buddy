import {
  Sparkles, Wrench, Hammer, Truck, Paintbrush, Zap,
  Droplets, Leaf, ShoppingCart, Package, ArrowUp, ClipboardList,
  Heart, Languages, Camera, Laptop, GraduationCap, Globe,
  ChefHat, PartyPopper, HelpCircle, Activity
} from 'lucide-react';

export const TASK_CATEGORIES = [
  'Cleaning',
  'Handy Person',
  'Furniture Assembly',
  'Transport & Removals',
  'Repairs',
  'Painting',
  'Electrical',
  'Plumbing',
  'Gardening & Plant Care',
  'Shopping',
  'Delivery',
  'Packing & Lifting',
  'Errands',
  'Pet Care',
  'Translation',
  'Photography',
  'Design',
  'Tutoring',
  'Online',
  'Cooking',
  'Events',
  'Personal Assistance',
  'Moving',
  'Custom / Other',
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
  'Cleaning': '🧹',
  'Handy Person': '🔧',
  'Furniture Assembly': '🪑',
  'Transport & Removals': '🚚',
  'Repairs': '🔧',
  'Painting': '🎨',
  'Electrical': '⚡',
  'Plumbing': '🚰',
  'Gardening & Plant Care': '🏡',
  'Shopping': '🛒',
  'Delivery': '📦',
  'Packing & Lifting': '📦',
  'Errands': '📋',
  'Pet Care': '🐱',
  'Translation': '🌐',
  'Photography': '📷',
  'Design': '💻',
  'Tutoring': '🎓',
  'Online': '🌐',
  'Cooking': '🍳',
  'Events': '🎉',
  'Personal Assistance': '🤝',
  'Moving': '📦',
  'Custom / Other': '📋',
};

export const CATEGORY_LUCIDE_ICONS: Record<string, any> = {
  'Cleaning': Sparkles,
  'Handy Person': Wrench,
  'Furniture Assembly': Hammer,
  'Transport & Removals': Truck,
  'Repairs': Wrench,
  'Painting': Paintbrush,
  'Electrical': Zap,
  'Plumbing': Droplets,
  'Gardening & Plant Care': Leaf,
  'Shopping': ShoppingCart,
  'Delivery': Package,
  'Packing & Lifting': ArrowUp,
  'Errands': ClipboardList,
  'Pet Care': Heart,
  'Translation': Languages,
  'Photography': Camera,
  'Design': Laptop,
  'Tutoring': GraduationCap,
  'Online': Globe,
  'Cooking': ChefHat,
  'Events': PartyPopper,
  'Personal Assistance': Activity,
  'Moving': Truck,
  'Custom / Other': HelpCircle,
};

export const AUSTRALIAN_CITIES = ['Berlin', 'Hamburg', 'Munich', 'Frankfurt', 'Cologne'];
