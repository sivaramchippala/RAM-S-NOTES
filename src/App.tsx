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

  if (storageMode === 'drive' && !hasHydratedDrive) {
    return <InitialDriveLoader />;
  }

  return (
    <>
      <DashboardPage />
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
    <div className="h-screen w-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Loading your Drive notes
          </h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Please wait</span>
        </div>
        <div className="h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-neutral-900 dark:bg-neutral-100 drive-loader-bar" />
        </div>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Connecting to Google Drive and preparing your folder structure.
        </p>
      </div>
    </div>
  );
}
 
export default App;
