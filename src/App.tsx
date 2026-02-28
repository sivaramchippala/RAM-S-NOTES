import { useEffect, useRef, useState } from 'react';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { useAuthStore } from './store/authStore';
import { useNotesStore } from './store/notesStore';
import { useThemeStore } from './store/themeStore';
import { Modal } from './components/ui/Modal';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storageMode = useAuthStore((s) => s.storageMode);
  const isDark = useThemeStore((s) => s.isDark);
  const hydrateFromDrive = useNotesStore((s) => s.hydrateFromDrive);
  const isHydratingDrive = useNotesStore((s) => s.isHydratingDrive);
  const hasHydratedDrive = useNotesStore((s) => s.hasHydratedDrive);
  const [isUnsavedAlertOpen, setIsUnsavedAlertOpen] = useState(false);
  const hiddenWithUnsavedRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (isAuthenticated && storageMode === 'drive' && !hasHydratedDrive) {
      void hydrateFromDrive();
    }
  }, [isAuthenticated, storageMode, hasHydratedDrive, hydrateFromDrive]);

  useEffect(() => {
    if (!isAuthenticated || storageMode !== 'drive') return;

    const handleVisibilityChange = () => {
      const { hasUnsavedChanges, isDriveSyncing } = useNotesStore.getState();
      if (document.visibilityState === 'hidden') {
        hiddenWithUnsavedRef.current = hasUnsavedChanges && !isDriveSyncing;
        return;
      }
      if (document.visibilityState === 'visible' && hiddenWithUnsavedRef.current) {
        setIsUnsavedAlertOpen(true);
        hiddenWithUnsavedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, storageMode]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <>
      <DashboardPage />
      {storageMode === 'drive' && !hasHydratedDrive ? <InitialDriveLoader /> : null}
      <Modal
        isOpen={isUnsavedAlertOpen}
        onClose={() => setIsUnsavedAlertOpen(false)}
        title="Unsaved changes"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            You changed screen/tab with unsaved notes. Click Save in the top bar to upload to Google Drive.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setIsUnsavedAlertOpen(false)}
              className="px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function InitialDriveLoader() {
  return (
    <div className="fixed inset-0 z-[1200] pointer-events-none flex items-center justify-center px-6">
      <div className="w-auto rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-xl px-5 py-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-200 text-center mb-2">
          Loading files and folders...
        </p>
        <div className="load-row mx-auto" aria-label="Loading files and folders">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
 
export default App;
