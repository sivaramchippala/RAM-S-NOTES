import { create } from 'zustand';
import type { FolderItem } from '../types';
import { loadNotesFromDrive, saveNotesToDrive } from '../lib/driveClient';

const STORAGE_KEY = 'rams-notes-data';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadData(): FolderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultData();
  } catch {
    return getDefaultData();
  }
}

function getDefaultData(): FolderItem[] {
  const now = Date.now();
  return [
    {
      id: 'welcome-folder',
      name: 'Getting Started',
      parentId: null,
      type: 'folder',
      isExpanded: true,
      createdAt: now,
      updatedAt: now,
      children: [
        {
          id: 'welcome-note',
          name: 'Welcome to Ram\'s Notes',
          parentId: 'welcome-folder',
          type: 'file',
          children: [],
          content: '<h1>Welcome to Ram\'s Notes ✨</h1><p>Your personal knowledge base, inspired by the clean and minimal style of modern documentation tools.</p><h2>Quick Tips</h2><ul><li><strong>Create folders</strong> to organize your notes by topic</li><li><strong>Nest subfolders</strong> for detailed categorization</li><li><strong>Rich text editing</strong> with full formatting support</li><li><strong>Copy-paste</strong> directly from ChatGPT and other AI tools</li><li><strong>Tables, images, code blocks</strong> — all supported!</li></ul><blockquote><p>Start by creating a new folder in the sidebar, then add your first note.</p></blockquote>',
          createdAt: now,
          updatedAt: now,
        },
      ],
    },
  ];
}

function persistData(items: FolderItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function findItemById(items: FolderItem[], id: string): FolderItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItemById(item.children, id);
    if (found) return found;
  }
  return null;
}

function removeItemById(items: FolderItem[], id: string): FolderItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, children: removeItemById(item.children, id) }));
}

function updateItemById(
  items: FolderItem[],
  id: string,
  updater: (item: FolderItem) => FolderItem
): FolderItem[] {
  return items.map((item) => {
    if (item.id === id) return updater(item);
    return { ...item, children: updateItemById(item.children, id, updater) };
  });
}

function addChildToParent(items: FolderItem[], parentId: string, child: FolderItem): FolderItem[] {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...item.children, child], isExpanded: true };
    }
    return { ...item, children: addChildToParent(item.children, parentId, child) };
  });
}

interface NotesState {
  items: FolderItem[];
  activeFileId: string | null;
  searchQuery: string;
  hasUnsavedChanges: boolean;
  isHydratingDrive: boolean;
  hasHydratedDrive: boolean;
  isDriveSyncing: boolean;
  driveError: string | null;
  lastSyncedAt: number | null;
  setSearchQuery: (q: string) => void;
  setActiveFile: (id: string | null) => void;
  createFolder: (name: string, parentId: string | null) => void;
  createFile: (name: string, parentId: string | null) => void;
  deleteItem: (id: string) => void;
  renameItem: (id: string, name: string) => void;
  updateContent: (id: string, content: string) => void;
  toggleExpand: (id: string) => void;
  hydrateFromDrive: () => Promise<void>;
  syncToDrive: (itemsOverride?: FolderItem[], force?: boolean) => Promise<void>;
  getActiveFile: () => FolderItem | null;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  items: loadData(),
  activeFileId: null,
  searchQuery: '',
  hasUnsavedChanges: false,
  isHydratingDrive: false,
  hasHydratedDrive: false,
  isDriveSyncing: false,
  driveError: null,
  lastSyncedAt: null,

  setSearchQuery: (q) => set({ searchQuery: q }),

  setActiveFile: (id) => set({ activeFileId: id }),

  createFolder: (name, parentId) => {
    const now = Date.now();
    const folder: FolderItem = {
      id: generateId(),
      name,
      parentId,
      type: 'folder',
      children: [],
      createdAt: now,
      updatedAt: now,
      isExpanded: false,
    };
    set((state) => {
      const newItems = parentId
        ? addChildToParent(state.items, parentId, folder)
        : [...state.items, folder];
      persistData(newItems);
      return { items: newItems, hasUnsavedChanges: true };
    });
  },

  createFile: (name, parentId) => {
    const now = Date.now();
    const file: FolderItem = {
      id: generateId(),
      name,
      parentId,
      type: 'file',
      children: [],
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const newItems = parentId
        ? addChildToParent(state.items, parentId, file)
        : [...state.items, file];
      persistData(newItems);
      return { items: newItems, activeFileId: file.id, hasUnsavedChanges: true };
    });
  },

  deleteItem: (id) => {
    set((state) => {
      const newItems = removeItemById(state.items, id);
      persistData(newItems);
      return {
        items: newItems,
        hasUnsavedChanges: true,
        activeFileId: state.activeFileId === id ? null : state.activeFileId,
      };
    });
  },

  renameItem: (id, name) => {
    set((state) => {
      const newItems = updateItemById(state.items, id, (item) => ({
        ...item,
        name,
        updatedAt: Date.now(),
      }));
      persistData(newItems);
      return { items: newItems, hasUnsavedChanges: true };
    });
  },

  updateContent: (id, content) => {
    set((state) => {
      const existingItem = findItemById(state.items, id);
      if (!existingItem || existingItem.type !== 'file') {
        return state;
      }

      if ((existingItem.content ?? '') === content) {
        return state;
      }

      const newItems = updateItemById(state.items, id, (item) => ({
        ...item,
        content,
        updatedAt: Date.now(),
      }));
      persistData(newItems);
      return { items: newItems, hasUnsavedChanges: true };
    });
  },

  toggleExpand: (id) => {
    set((state) => {
      const newItems = updateItemById(state.items, id, (item) => ({
        ...item,
        isExpanded: !item.isExpanded,
      }));
      persistData(newItems);
      return { items: newItems };
    });
  },

  hydrateFromDrive: async () => {
    try {
      set({ isHydratingDrive: true, driveError: null });
      const driveItems = await loadNotesFromDrive();
      if (driveItems) {
        persistData(driveItems);
        set({ items: driveItems, hasUnsavedChanges: false, lastSyncedAt: Date.now() });
      } else {
        await get().syncToDrive(get().items, true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Drive sync failed.';
      set({ driveError: message });
    } finally {
      set({ isHydratingDrive: false, hasHydratedDrive: true });
    }
  },

  syncToDrive: async (itemsOverride, force = false) => {
    if (!force && !get().hasUnsavedChanges && !itemsOverride) {
      return;
    }

    const itemsToSave = itemsOverride ?? get().items;

    try {
      set({ isDriveSyncing: true, driveError: null });
      await saveNotesToDrive(itemsToSave);
      set({ lastSyncedAt: Date.now(), hasUnsavedChanges: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Drive sync failed.';
      set({ driveError: message });
    } finally {
      set({ isDriveSyncing: false });
    }
  },

  getActiveFile: () => {
    const { items, activeFileId } = get();
    if (!activeFileId) return null;
    return findItemById(items, activeFileId);
  },
}));
