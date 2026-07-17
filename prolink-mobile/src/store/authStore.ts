import { create } from 'zustand';
import api from '../lib/api';
import { tokenStorage } from '../lib/secureStore';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  user_type: 'client' | 'provider' | 'admin';
  email_verified: boolean;
  avatar_url?: string | null;
  profile_completed: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // Backend returns { token: "..." } directly (not wrapped in data envelope)
    const token = res.data.token;
    await tokenStorage.setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, isAuthenticated: true });
    await get().fetchUser();
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const token = res.data.token;
    await tokenStorage.setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    await tokenStorage.removeToken();
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/profiles/me');
      // Backend returns profile object directly — extract user info
      const d = res.data;
      const userData: User = d.user
        ? {
            id: d.user.id,
            email: d.user.email,
            full_name: d.full_name || d.user.full_name || null,
            user_type: d.user.user_type,
            email_verified: d.user.email_verified,
            avatar_url: d.profile_picture_url || d.user.avatar_url,
            profile_completed: Boolean(d.full_name),
          }
        : {
            id: d.user_id,
            email: d.email || '',
            full_name: d.full_name || null,
            user_type: d.user_type || 'client',
            email_verified: d.email_verified || false,
            avatar_url: d.profile_picture_url,
            profile_completed: Boolean(d.full_name),
          };
      set({ user: userData, isLoading: false });
    } catch {
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },

  setToken: async (token) => {
    await tokenStorage.setToken(token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, isAuthenticated: true });
  },
}));
