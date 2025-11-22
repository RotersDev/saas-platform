import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Carregar tema do localStorage na inicialização
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('store-theme-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.state?.theme || 'light';
    } catch {
      return 'light';
    }
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('store-theme-storage', JSON.stringify({ state: { theme } }));
    }
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('store-theme-storage', JSON.stringify({ state: { theme: newTheme } }));
      }
      return { theme: newTheme };
    });
  },
}));

