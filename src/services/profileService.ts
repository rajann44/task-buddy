import { MOCK_USERS, MOCK_CLIENT_PROFILES, MOCK_COTASKER_PROFILES } from '../data/users';
import type { User, ClientProfile, CoTaskerProfile } from '../types';
import { supabase } from '../utils/supabaseClient';

let users = [...MOCK_USERS];
let clientProfiles = [...MOCK_CLIENT_PROFILES];
let coTaskerProfiles = [...MOCK_COTASKER_PROFILES];

export const profileService = {
  async getUserById(id: string): Promise<User | null> {
    await new Promise((r) => setTimeout(r, 50));
    const mockUser = users.find((u) => u.id === id);
    if (mockUser) return mockUser;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return null;
      return {
        id: data.id,
        email: data.email,
        role: data.role as any,
        name: data.name,
        avatarUrl: data.avatar_url || undefined,
        coTaskerStatus: data.co_tasker_status || 'none',
        isDisabled: data.is_disabled,
        createdAt: data.created_at,
        password: '',
      };
    } catch (err) {
      console.error('Error in getUserById:', err);
      return null;
    }
  },

  async getClientProfile(userId: string): Promise<ClientProfile | null> {
    await new Promise((r) => setTimeout(r, 50));
    const mockProfile = clientProfiles.find((p) => p.userId === userId);
    if (mockProfile) return mockProfile;

    try {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) return null;
      return {
        userId: data.user_id,
        bio: data.bio || '',
        location: data.location,
        tasksPosted: 0,
        completedTasks: 0,
        memberSince: new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isVerified: data.is_verified || false,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('Error in getClientProfile:', err);
      return null;
    }
  },

  async getCoTaskerProfile(userId: string): Promise<CoTaskerProfile | null> {
    await new Promise((r) => setTimeout(r, 50));
    const mockProfile = coTaskerProfiles.find((p) => p.userId === userId);
    if (mockProfile) return mockProfile;

    try {
      const { data, error } = await supabase
        .from('cotasker_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) return null;
      return {
        userId: data.user_id,
        bio: data.bio,
        skills: data.skills || [],
        categories: data.categories || [],
        location: data.location,
        rating: Number(data.rating),
        reviewCount: data.review_count,
        completedJobs: data.completed_jobs,
        responseTime: data.response_time,
        memberSince: new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isVerified: data.is_verified || false,
        isTopRated: false,
        isFastResponder: false,
        totalEarnings: 0,
        availability: data.availability,
        hourlyRate: Number(data.hourly_rate),
        qualifications: data.qualifications || [],
        languages: data.languages || [],
        transport: data.transport || '',
        portfolio: data.portfolio || [],
      };
    } catch (err) {
      console.error('Error in getCoTaskerProfile:', err);
      return null;
    }
  },

  async getAllUsers(): Promise<User[]> {
    await new Promise((r) => setTimeout(r, 50));
    return users;
  },

  async updateCoTaskerProfile(userId: string, profileData: Partial<CoTaskerProfile>): Promise<CoTaskerProfile> {
    await new Promise((r) => setTimeout(r, 50));
    const idx = coTaskerProfiles.findIndex((p) => p.userId === userId);
    if (idx !== -1) {
      coTaskerProfiles[idx] = { ...coTaskerProfiles[idx], ...profileData };
      return coTaskerProfiles[idx];
    } else {
      const newProfile: CoTaskerProfile = {
        userId,
        bio: '',
        skills: [],
        categories: [],
        location: 'Berlin',
        rating: 5.0,
        reviewCount: 0,
        completedJobs: 0,
        responseTime: '< 1 hour',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isVerified: false,
        isTopRated: false,
        isFastResponder: false,
        totalEarnings: 0,
        availability: 'Flexible',
        hourlyRate: 25,
        qualifications: [],
        languages: ['English'],
        transport: '',
        portfolio: [],
        ...profileData,
      };
      coTaskerProfiles.push(newProfile);
      return newProfile;
    }
  },

  async updateClientProfile(userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> {
    await new Promise((r) => setTimeout(r, 50));
    const idx = clientProfiles.findIndex((p) => p.userId === userId);
    if (idx !== -1) {
      clientProfiles[idx] = { ...clientProfiles[idx], ...profileData };
      return clientProfiles[idx];
    } else {
      const newProfile: ClientProfile = {
        userId,
        bio: '',
        location: 'Berlin',
        tasksPosted: 0,
        completedTasks: 0,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isVerified: false,
        createdAt: new Date().toISOString(),
        ...profileData,
      };
      clientProfiles.push(newProfile);
      return newProfile;
    }
  },

  async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
    await new Promise((r) => setTimeout(r, 50));
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...userData };
      return users[idx];
    }
    return null;
  }
};

