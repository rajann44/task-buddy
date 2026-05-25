import type { Notification } from '../types';

export const notificationService = {
  async getForUser(notifications: Notification[], userId: string): Promise<Notification[]> {
    await new Promise((r) => setTimeout(r, 80));
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUnreadCount(notifications: Notification[], userId: string): Promise<number> {
    await new Promise((r) => setTimeout(r, 40));
    return notifications.filter((n) => n.userId === userId && !n.isRead).length;
  },
};
