import { MOCK_USERS, MOCK_CLIENT_PROFILES, MOCK_COTASKER_PROFILES } from '../data/users';
import type { User, ClientProfile, CoTaskerProfile } from '../types';

export const profileService = {
  async getUserById(id: string): Promise<User | null> {
    await new Promise((r) => setTimeout(r, 80));
    return MOCK_USERS.find((u) => u.id === id) ?? null;
  },

  async getClientProfile(userId: string): Promise<ClientProfile | null> {
    await new Promise((r) => setTimeout(r, 80));
    return MOCK_CLIENT_PROFILES.find((p) => p.userId === userId) ?? null;
  },

  async getCoTaskerProfile(userId: string): Promise<CoTaskerProfile | null> {
    await new Promise((r) => setTimeout(r, 80));
    return MOCK_COTASKER_PROFILES.find((p) => p.userId === userId) ?? null;
  },

  async getAllUsers(): Promise<User[]> {
    await new Promise((r) => setTimeout(r, 80));
    return MOCK_USERS;
  },
};
