import { useState } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import { motion } from 'framer-motion';
import { Modal } from '../ui/Modal';

export function Navbar() {
  const { isDark, toggle } = useThemeStore();
  const { user, logout, storageMode } = useAuthStore();
  const isReadOnlyDriveUser = storageMode === 'drive' && user?.role === 'user';
  const isAdminDriveUser = storageMode === 'drive' && user?.role === 'admin';
  const { isDriveSyncing, driveError, lastSyncedAt, hasUnsavedChanges, syncToDrive } = useNotesStore((s) => ({
    isDriveSyncing: s.isDriveSyncing,
    driveError: s.driveError,
    lastSyncedAt: s.lastSyncedAt,
    hasUnsavedChanges: s.hasUnsavedChanges,
    syncToDrive: s.syncToDrive,
  }));
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
              <span className="text-white dark:text-neutral-900 font-bold text-sm">R</span>
            </div>
            <h1 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Ram's Notes
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            {storageMode === 'local' ? (
              <span>Demo mode: saved in localStorage</span>
            ) : isReadOnlyDriveUser ? (
              <>
                <span>View only mode: synced from Drive</span>
                {driveError ? (
                  <span
                    className="text-red-500 dark:text-red-400 max-w-[260px] truncate"
                    title={driveError}
                  >
                    {driveError}
                  </span>
                ) : null}
              </>
            ) : (
              <>
                {isDriveSyncing ? (
                  <span>Saving to Drive...</span>
                ) : driveError ? (
                  <span
                    className="text-red-500 dark:text-red-400 max-w-[360px] truncate"
                    title={driveError}
                  >
                    {driveError}
                  </span>
                ) : hasUnsavedChanges ? (
                  <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
                ) : lastSyncedAt ? (
                  <span>
                    Saved {new Date(lastSyncedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span>Drive not synced yet</span>
                )}
                {isAdminDriveUser ? (
                  <button
                    onClick={() => void syncToDrive(undefined, true)}
                    disabled={isDriveSyncing || !hasUnsavedChanges}
                    className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                ) : null}
              </>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>

          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-neutral-200 dark:border-neutral-700">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium hidden sm:block">
              {user?.name || 'User'}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLogoutModalOpen(true)}
            className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors ml-1"
            title="Logout"
          >
            <LogOut size={18} />
          </motion.button>
        </div>
      </header>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Confirm Logout">
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsLogoutModalOpen(false);
                logout();
              }}
              className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
