import { create } from 'zustand';
import type { AuthView, User } from '../types';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase() || 'sivaram@gmail.com';
const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || 'Sivaram@123';
const ADMIN_NAME = (import.meta.env.VITE_ADMIN_NAME as string | undefined) || 'Admin';

const VIEWER_EMAIL = (import.meta.env.VITE_VIEWER_EMAIL as string | undefined)?.trim().toLowerCase() || 'viewer@ramnotes.app';
const VIEWER_PASSWORD = (import.meta.env.VITE_VIEWER_PASSWORD as string | undefined) || 'Viewer@2026';
const VIEWER_NAME = (import.meta.env.VITE_VIEWER_NAME as string | undefined) || 'Viewer User';

const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined)?.trim().toLowerCase() || 'demo@ramnotes.app';
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) || 'Demo@2026';
const DEMO_NAME = (import.meta.env.VITE_DEMO_NAME as string | undefined) || 'Demo User';

const STORAGE_MODE_KEY = 'rams-notes-storage-mode';
const USER_KEY = 'rams-notes-user';

type StorageMode = 'drive' | 'local';

function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed?.email || !parsed?.name) return null;
    return {
      id: parsed.id || 'legacy-user',
      name: parsed.name,
      email: parsed.email,
      role: parsed.role || ((localStorage.getItem(STORAGE_MODE_KEY) as StorageMode) === 'local' ? 'demo' : 'admin'),
      avatar: parsed.avatar,
    };
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  storageMode: StorageMode;
  currentView: AuthView;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  setView: (view: AuthView) => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyResetCode: (code: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  logout: () => void;
  clearMessages: () => void;
}

const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  storageMode: (localStorage.getItem(STORAGE_MODE_KEY) as StorageMode) || 'drive',
  currentView: 'signin',
  isLoading: false,
  error: null,
  successMessage: null,

  setView: (view) => set({ currentView: view, error: null, successMessage: null }),

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user: User = { id: 'admin-1', name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin' };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_MODE_KEY, 'drive');
      set({ user, isAuthenticated: true, storageMode: 'drive', isLoading: false });
      return true;
    }

    if (normalizedEmail === VIEWER_EMAIL && password === VIEWER_PASSWORD) {
      const user: User = { id: 'viewer-1', name: VIEWER_NAME, email: VIEWER_EMAIL, role: 'user' };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_MODE_KEY, 'drive');
      set({ user, isAuthenticated: true, storageMode: 'drive', isLoading: false });
      return true;
    }

    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const user: User = { id: 'demo-1', name: DEMO_NAME, email: DEMO_EMAIL, role: 'demo' };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_MODE_KEY, 'local');
      set({ user, isAuthenticated: true, storageMode: 'local', isLoading: false });
      return true;
    }

    set({
      isLoading: false,
      error: 'Invalid credentials. Use admin, user, or demo credentials from your .env setup.',
    });
    return false;
  },

  signUp: async (name, email, password) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));
    if (email && password && name) {
      set({
        isLoading: false,
        currentView: 'email-verification',
        successMessage: `Verification code sent to ${email}`,
      });
      return true;
    }
    set({ isLoading: false, error: 'Please fill all fields correctly.' });
    return false;
  },

  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));
    if (code.length === 6) {
      set({
        isLoading: false,
        currentView: 'signin',
        successMessage: 'Email verified successfully! Please sign in.',
      });
      return true;
    }
    set({ isLoading: false, error: 'Invalid verification code. Please try again.' });
    return false;
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));
    if (email) {
      set({
        isLoading: false,
        currentView: 'forgot-password-code',
        successMessage: `Reset code sent to ${email}`,
      });
      return true;
    }
    set({ isLoading: false, error: 'Please enter a valid email.' });
    return false;
  },

  verifyResetCode: async (code) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));
    if (code.length === 6) {
      set({
        isLoading: false,
        currentView: 'new-password',
        successMessage: 'Code verified. Set your new password.',
      });
      return true;
    }
    set({ isLoading: false, error: 'Invalid code. Please try again.' });
    return false;
  },

  resetPassword: async (password) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));
    if (password) {
      set({
        isLoading: false,
        currentView: 'signin',
        successMessage: 'Password reset successful! Please sign in.',
      });
      return true;
    }
    set({ isLoading: false, error: 'Please enter a valid password.' });
    return false;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STORAGE_MODE_KEY);
    set({ user: null, isAuthenticated: false, storageMode: 'drive', currentView: 'signin' });
  },

  clearMessages: () => set({ error: null, successMessage: null }),
}));
