import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChevronRight, ChevronDown, Folder, FileText, Plus, MoreHorizontal,
  FolderPlus, FilePlus, Trash2, Pencil, Search, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNotesStore } from '../../store/notesStore';
import { useAuthStore } from '../../store/authStore';
import type { FolderItem } from '../../types';
import { Modal } from '../ui/Modal';

export function Sidebar() {
  const { items, activeFileId, searchQuery, setSearchQuery, createFolder, createFile } = useNotesStore();
  const isReadOnly = useAuthStore((s) => s.user?.role === 'user');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredItems = searchQuery
    ? filterItems(items, searchQuery.toLowerCase())
    : items;

  const openPrompt = useCallback((config: PromptConfig) => {
    setPromptConfig(config);
  }, []);

  const openConfirm = useCallback((config: ConfirmConfig) => {
    setConfirmConfig(config);
  }, []);

  return (
    <aside className="w-64 h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shrink-0">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 border-0 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filteredItems.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            depth={0}
            openPrompt={openPrompt}
            openConfirm={openConfirm}
            isReadOnly={isReadOnly}
          />
        ))}
        {filteredItems.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-6">
            {searchQuery ? 'No results found' : isReadOnly ? 'No notes available.' : 'No notes yet. Create one!'}
          </p>
        )}
      </div>

      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 relative" ref={menuRef}>
        {isReadOnly ? (
          <div className="w-full py-2 rounded-lg text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800">
            View only access
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Plus size={16} /> New
            </button>
            <AnimatePresence>
              {showNewMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden z-20"
                >
                  <button
                    onClick={() => {
                      openPrompt({
                        title: 'Create Folder',
                        label: 'Folder name',
                        placeholder: 'Enter folder name',
                        submitLabel: 'Create',
                        onSubmit: (name) => {
                          if (hasDuplicateName(items, null, name)) {
                            return 'A folder or note with this name already exists in this location.';
                          }
                          createFolder(name, null);
                          setShowNewMenu(false);
                        },
                      });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FolderPlus size={15} /> New Folder
                  </button>
                  <button
                    onClick={() => {
                      openPrompt({
                        title: 'Create Note',
                        label: 'Note name',
                        placeholder: 'Enter note name',
                        submitLabel: 'Create',
                        onSubmit: (name) => {
                          if (hasDuplicateName(items, null, name)) {
                            return 'A folder or note with this name already exists in this location.';
                          }
                          createFile(name, null);
                          setShowNewMenu(false);
                        },
                      });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FilePlus size={15} /> New Note
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <PromptModal
        config={promptConfig}
        onClose={() => setPromptConfig(null)}
      />

      <ConfirmModal
        config={confirmConfig}
        onClose={() => setConfirmConfig(null)}
      />
    </aside>
  );
}

function TreeNode({
  item,
  depth,
  openPrompt,
  openConfirm,
  isReadOnly,
}: {
  item: FolderItem;
  depth: number;
  openPrompt: (config: PromptConfig) => void;
  openConfirm: (config: ConfirmConfig) => void;
  isReadOnly: boolean;
}) {
  const {
    items, activeFileId, setActiveFile, toggleExpand,
    createFolder, createFile, deleteItem, renameItem,
  } = useNotesStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isActive = item.id === activeFileId;
  const isFolder = item.type === 'folder';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = () => {
    if (isFolder) toggleExpand(item.id);
    else setActiveFile(item.id);
  };

  return (
    <div>
      <div
        className={clsx(
          'group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-sm transition-all duration-150 relative',
          isActive
            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
          item.isExpanded ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isFolder ? (
          <Folder size={15} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
        ) : (
          <FileText size={15} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
        )}
        <span className="truncate flex-1 ml-1">{item.name}</span>
        {!isReadOnly ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-30 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isFolder && (
                    <>
                      <button
                        onClick={() => {
                          openPrompt({
                            title: 'Create Subfolder',
                            label: 'Subfolder name',
                            placeholder: 'Enter subfolder name',
                            submitLabel: 'Create',
                            onSubmit: (name) => {
                              if (hasDuplicateName(items, item.id, name)) {
                                return 'A folder or note with this name already exists in this location.';
                              }
                              createFolder(name, item.id);
                            },
                          });
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      >
                        <FolderPlus size={13} /> New Subfolder
                      </button>
                      <button
                        onClick={() => {
                          openPrompt({
                            title: 'Create Note',
                            label: 'Note name',
                            placeholder: 'Enter note name',
                            submitLabel: 'Create',
                            onSubmit: (name) => {
                              if (hasDuplicateName(items, item.id, name)) {
                                return 'A folder or note with this name already exists in this location.';
                              }
                              createFile(name, item.id);
                            },
                          });
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      >
                        <FilePlus size={13} /> New Note
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      openPrompt({
                        title: 'Rename Item',
                        label: 'Name',
                        placeholder: 'Enter name',
                        initialValue: item.name,
                        submitLabel: 'Save',
                        onSubmit: (name) => {
                          if (hasDuplicateName(items, item.parentId, name, item.id)) {
                            return 'A folder or note with this name already exists in this location.';
                          }
                          renameItem(item.id, name);
                        },
                      });
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <Pencil size={13} /> Rename
                  </button>
                  <button
                    onClick={() => {
                      openConfirm({
                        title: 'Delete Item',
                        message: `Delete "${item.name}"? This action cannot be undone.`,
                        confirmLabel: 'Delete',
                        onConfirm: () => deleteItem(item.id),
                      });
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
      <AnimatePresence>
        {isFolder && item.isExpanded && item.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {item.children.map((child) => (
              <TreeNode
                key={child.id}
                item={child}
                depth={depth + 1}
                openPrompt={openPrompt}
                openConfirm={openConfirm}
                isReadOnly={isReadOnly}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PromptConfig {
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (value: string) => string | void;
}

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

function PromptModal({ config, onClose }: { config: PromptConfig | null; onClose: () => void }) {
  const [value, setValue] = useState(config?.initialValue ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setValue(config?.initialValue ?? '');
    setErrorMessage(null);
  }, [config]);

  const submit = () => {
    if (!config) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const validationError = config.onSubmit(trimmed);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    onClose();
  };

  return (
    <Modal isOpen={!!config} onClose={onClose} title={config?.title}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {config?.label}
          </label>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={config?.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
        </div>
        {errorMessage && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {errorMessage}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {config?.submitLabel ?? 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ config, onClose }: { config: ConfirmConfig | null; onClose: () => void }) {
  const confirm = () => {
    if (!config) return;
    config.onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={!!config} onClose={onClose} title={config?.title}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {config?.message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            {config?.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function filterItems(items: FolderItem[], query: string): FolderItem[] {
  return items
    .map((item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const filteredChildren = filterItems(item.children, query);
      if (nameMatch || filteredChildren.length > 0) {
        return { ...item, children: filteredChildren, isExpanded: true };
      }
      return null;
    })
    .filter(Boolean) as FolderItem[];
}

function findItemById(items: FolderItem[], id: string): FolderItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItemById(item.children, id);
    if (found) return found;
  }
  return null;
}

function hasDuplicateName(
  items: FolderItem[],
  parentId: string | null,
  name: string,
  excludeId?: string
): boolean {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) return false;

  const siblings = parentId ? findItemById(items, parentId)?.children ?? [] : items;

  return siblings.some(
    (item) => item.id !== excludeId && item.name.trim().toLowerCase() === normalizedName
  );
}
