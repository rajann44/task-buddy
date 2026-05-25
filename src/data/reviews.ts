import type { Review } from '../types';

export const MOCK_REVIEWS: Review[] = [
  // Task 3 — Furniture Assembly (completed)
  {
    id: 'review-1',
    taskId: 'task-3',
    fromUserId: 'user-2',
    toUserId: 'user-3',
    rating: 5,
    comment: 'Marcus was absolutely fantastic. He assembled all 3 PAX wardrobes in under 3 hours and even helped us position them correctly. Left no mess behind. Highly recommended!',
    createdAt: '2025-05-23T17:00:00Z',
  },
  // Task 6 — Delivery (completed)
  {
    id: 'review-2',
    taskId: 'task-6',
    fromUserId: 'user-1',
    toUserId: 'user-4',
    rating: 5,
    comment: 'Priya has been absolutely wonderful with my mother. Punctual, caring, and always gets everything right from the shopping list. My mum actually looks forward to her visits!',
    createdAt: '2025-05-18T14:00:00Z',
  },
  // Task 9 — Cleaning (completed)
  {
    id: 'review-3',
    taskId: 'task-9',
    fromUserId: 'user-2',
    toUserId: 'user-4',
    rating: 4,
    comment: 'Great job on a very difficult post-reno clean. The apartment was spotless. Only minor issue was she ran slightly over the estimated time, but the result was worth it.',
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'review-4',
    taskId: 'task-3',
    fromUserId: 'user-3',
    toUserId: 'user-2',
    rating: 5,
    comment: 'James was a great client. Clear instructions, everything was ready when I arrived. Payment prompt. Would happily work with him again.',
    createdAt: '2025-05-23T18:00:00Z',
  },
  {
    id: 'review-5',
    taskId: 'task-6',
    fromUserId: 'user-4',
    toUserId: 'user-1',
    rating: 5,
    comment: 'Sarah is a very thoughtful client. The shopping list is always clear and detailed. Always ready with payment immediately after the task.',
    createdAt: '2025-05-18T15:00:00Z',
  },
];
