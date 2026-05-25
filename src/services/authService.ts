import type { User } from '../types';
import { MOCK_USERS } from '../data/users';

const SESSION_KEY = 'taskbuddy_session';

export interface AuthResult {
  user: User;
  token: string; // mock token
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    const result: AuthResult = {
      user,
      token: `mock-token-${user.id}-${Date.now()}`,
    };

    // Persist to sessionStorage
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));

    return result;
  },

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    sessionStorage.removeItem(SESSION_KEY);
  },

  getStoredSession(): AuthResult | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthResult;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const session = this.getStoredSession();
    return session?.user ?? null;
  },
};
