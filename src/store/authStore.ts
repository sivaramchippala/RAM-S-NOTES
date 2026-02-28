import { create } from 'zustand';
import type { AuthView, User } from '../types';

const DRIVE_USER_EMAIL = 'sivaram@gmail.com';
const DRIVE_USER_PASSWORD = 'Sivaram@123';
const LOCAL_DEMO_EMAIL = 'demo@ramnotes.app';
const LOCAL_DEMO_PASSWORD = 'Demo@2026';
const STORAGE_MODE_KEY = 'rams-notes-storage-mode';

type StorageMode = 'drive' | 'local';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('rams-notes-user')
    ? JSON.parse(localStorage.getItem('rams-notes-user')!)
    : null,
  isAuthenticated: !!localStorage.getItem('rams-notes-user'),
  storageMode: (localStorage.getItem(STORAGE_MODE_KEY) as StorageMode) || 'drive',
  currentView: 'signin',
  isLoading: false,
  error: null,
  successMessage: null,

  setView: (view) => set({ currentView: view, error: null, successMessage: null }),

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 800));
    if (email === DRIVE_USER_EMAIL && password === DRIVE_USER_PASSWORD) {
      const user: User = { id: '1', name: 'Sivaram', email: DRIVE_USER_EMAIL };
      localStorage.setItem('rams-notes-user', JSON.stringify(user));
      localStorage.setItem(STORAGE_MODE_KEY, 'drive');
      set({ user, isAuthenticated: true, storageMode: 'drive', isLoading: false });
      return true;
    }
    if (email === LOCAL_DEMO_EMAIL && password === LOCAL_DEMO_PASSWORD) {
      const user: User = { id: '2', name: 'Demo User', email: LOCAL_DEMO_EMAIL };
      localStorage.setItem('rams-notes-user', JSON.stringify(user));
      localStorage.setItem(STORAGE_MODE_KEY, 'local');
      set({ user, isAuthenticated: true, storageMode: 'local', isLoading: false });
      return true;
    }
    set({
      isLoading: false,
      error: 'Invalid email or password. Use drive login or demo login credentials.',
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
    localStorage.removeItem('rams-notes-user');
    localStorage.removeItem(STORAGE_MODE_KEY);
    set({ user: null, isAuthenticated: false, storageMode: 'drive', currentView: 'signin' });
  },

  clearMessages: () => set({ error: null, successMessage: null }),
}));
