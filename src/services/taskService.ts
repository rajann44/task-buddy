// taskService.ts
// All methods accept/return promises so they can be swapped with real API calls.
// The actual data lives in AppContext; these services are thin async wrappers
// that the context dispatch handles.

import type { Task, TaskFilters } from '../types';

export const taskService = {
  async getTasks(tasks: Task[], filters?: TaskFilters): Promise<Task[]> {
    await new Promise((r) => setTimeout(r, 100));
    let result = [...tasks];

    if (filters?.category) {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters?.city) {
      result = result.filter((t) =>
        t.location.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.budgetMin !== undefined) {
      result = result.filter((t) => !t.budget || t.budget >= filters.budgetMin!);
    }
    if (filters?.budgetMax !== undefined) {
      result = result.filter((t) => !t.budget || t.budget <= filters.budgetMax!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getTaskById(tasks: Task[], id: string): Promise<Task | null> {
    await new Promise((r) => setTimeout(r, 80));
    return tasks.find((t) => t.id === id) ?? null;
  },

  async getTasksByClient(tasks: Task[], clientId: string): Promise<Task[]> {
    await new Promise((r) => setTimeout(r, 80));
    return tasks
      .filter((t) => t.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getTasksByCoTasker(tasks: Task[], coTaskerId: string): Promise<Task[]> {
    await new Promise((r) => setTimeout(r, 80));
    return tasks
      .filter((t) => t.assignedCoTaskerId === coTaskerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOpenTasks(tasks: Task[]): Promise<Task[]> {
    await new Promise((r) => setTimeout(r, 80));
    return tasks
      .filter((t) => t.status === 'open' || t.status === 'receiving_offers')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
