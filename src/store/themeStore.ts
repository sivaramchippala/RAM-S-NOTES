import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: localStorage.getItem('rams-notes-theme') === 'dark',
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem('rams-notes-theme', next ? 'dark' : 'light');
      return { isDark: next };
    }),
}));
