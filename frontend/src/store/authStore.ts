import { create } from 'zustand';
import api from '../config/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  store_id?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Função para inicializar do localStorage
  const initFromStorage = () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user, isAuthenticated: !!token && !!user };
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      return { token: null, user: null, isAuthenticated: false };
    }
  };

  const initialState = initFromStorage();

  return {
    ...initialState,
    login: async (email: string, password: string) => {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true });
    },
    register: async (name: string, email: string, password: string) => {
      const response = await api.post('/api/auth/register', { name, email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      set({ user: null, token: null, isAuthenticated: false });
    },
    setUser: (user: User) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },
  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  };
});


