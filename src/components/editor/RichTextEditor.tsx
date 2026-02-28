import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { createLowlight, common } from 'lowlight';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Quote,
  List, ListOrdered, Heading1, Heading2, Heading3, AlignLeft, AlignCenter,
  AlignRight, ImageIcon, Table as TableIcon, Highlighter, Undo, Redo,
  Minus, CodeSquare, Trash2, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useNotesStore } from '../../store/notesStore';
import { Modal } from '../ui/Modal';

const lowlight = createLowlight(common);
const IMAGE_MIN_WIDTH = 20;
const IMAGE_MAX_WIDTH = 100;
const IMAGE_STEP = 10;

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '70%',
        parseHTML: (element) => element.getAttribute('data-width') || element.style.width || '100%',
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes.width || '70%';
    const align = HTMLAttributes.align || 'center';
    const alignmentStyles: Record<string, string> = {
      left: 'display:block; margin-left:0; margin-right:auto;',
      center: 'display:block; margin-left:auto; margin-right:auto;',
      right: 'display:block; margin-left:auto; margin-right:0;',
    };
    const style = `width: ${width}; height: auto; ${alignmentStyles[align] || alignmentStyles.center}`;
    return [
      'img',
      {
        ...HTMLAttributes,
        style,
        'data-width': width,
        'data-align': align,
      },
    ];
  },
});

interface ToolButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolButton({ onClick, isActive, disabled, title, children }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'p-1.5 rounded-md transition-all duration-150',
        isActive
          ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-900 dark:text-white'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />;
}

export function RichTextEditor() {
  const { activeFileId, getActiveFile, updateContent } = useNotesStore();
  const activeFile = getActiveFile();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageControlsPos, setImageControlsPos] = useState<{ top: number; left: number } | null>(null);
  const [showImageControls, setShowImageControls] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your notes...' }),
      Highlight.configure({ multicolor: true }),
      CustomImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      TextStyle,
      Color,
    ],
    content: activeFile?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-12rem)] px-8 py-6 sm:px-12 sm:py-8 lg:px-16',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
        autocomplete: 'off',
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
      },
      handlePaste: (view, event) => {
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (activeFileId) {
          updateContent(activeFileId, editor.getHTML());
        }
      }, 300);
    },
  });

  useEffect(() => {
    if (editor && activeFile) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeFile.content) {
        editor.commands.setContent(activeFile.content || '');
      }
    }
  }, [activeFileId]);

  const openImageModal = useCallback(() => {
    setImageError(null);
    setImageUrlInput('');
    setIsImageModalOpen(true);
  }, []);

  const addImageFromUrl = useCallback(() => {
    if (!editor) return;
    const trimmedUrl = imageUrlInput.trim();
    if (!trimmedUrl) {
      setImageError('Please enter an image URL or upload from your computer.');
      return;
    }
    editor.chain().focus().setImage({ src: trimmedUrl, width: '70%', align: 'center' }).run();
    setIsImageModalOpen(false);
    setImageError(null);
    setImageUrlInput('');
  }, [editor, imageUrlInput]);

  const addImageFromFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!editor || !file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        editor.chain().focus().setImage({ src: result, width: '70%', align: 'center' }).run();
      }
      setIsImageModalOpen(false);
      setImageError(null);
      setImageUrlInput('');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const setSelectedImageWidth = useCallback((width: number) => {
    if (!editor || !editor.isActive('image')) return;
    const clamped = Math.max(IMAGE_MIN_WIDTH, Math.min(IMAGE_MAX_WIDTH, width));
    editor.chain().focus().updateAttributes('image', { width: `${clamped}%` }).run();
  }, [editor]);

  const setSelectedImageAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (!editor || !editor.isActive('image')) return;
    editor.chain().focus().updateAttributes('image', { align }).run();
  }, [editor]);

  const resizeSelectedImage = useCallback((delta: number) => {
    if (!editor || !editor.isActive('image')) return;
    const attrs = editor.getAttributes('image');
    const current = Number.parseInt(String(attrs.width ?? '100').replace('%', ''), 10);
    const next = Number.isFinite(current) ? current + delta : 70;
    setSelectedImageWidth(next);
  }, [editor, setSelectedImageWidth]);

  const deleteSelectedImage = useCallback(() => {
    if (!editor || !editor.isActive('image')) return;
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  const updateImageControlsPosition = useCallback(() => {
    if (!editor || !editorContainerRef.current || !editor.isActive('image') || !showImageControls) {
      setImageControlsPos(null);
      return;
    }

    const selected = editor.view.dom.querySelector('.ProseMirror-selectednode');
    if (!(selected instanceof HTMLElement)) {
      setImageControlsPos(null);
      return;
    }

    const imageRect = selected.getBoundingClientRect();
    const inViewport = imageRect.bottom > 0 && imageRect.top < window.innerHeight;
    if (!inViewport) {
      setImageControlsPos(null);
      return;
    }
    const maxLeft = window.innerWidth - 240;
    const left = Math.max(8, Math.min(maxLeft, imageRect.right - 230));
    const top = Math.max(8, imageRect.top + 8);
    setImageControlsPos({ top, left });
  }, [editor, showImageControls]);

  useEffect(() => {
    if (!editor) return;

    const onSelectionOrTransaction = () => updateImageControlsPosition();
    const onEditorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('img')) {
        setShowImageControls(true);
      } else {
        setShowImageControls(false);
        setImageControlsPos(null);
      }
    };
    const onAnyScroll = () => {
      setShowImageControls(false);
      setImageControlsPos(null);
    };

    editor.on('selectionUpdate', onSelectionOrTransaction);
    editor.on('transaction', onSelectionOrTransaction);
    window.addEventListener('resize', onSelectionOrTransaction);
    window.addEventListener('scroll', onAnyScroll, true);
    editor.view.dom.addEventListener('mousedown', onEditorClick);

    onSelectionOrTransaction();

    return () => {
      editor.off('selectionUpdate', onSelectionOrTransaction);
      editor.off('transaction', onSelectionOrTransaction);
      window.removeEventListener('resize', onSelectionOrTransaction);
      window.removeEventListener('scroll', onAnyScroll, true);
      editor.view.dom.removeEventListener('mousedown', onEditorClick);
    };
  }, [editor, updateImageControlsPosition]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">No note selected</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Select a note from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  if (!editor) return null;

  return (
    <div ref={editorContainerRef} className="flex-1 flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto shrink-0">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={addImageFromFile}
        />
        <ToolButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo size={15} />
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={15} />
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
          <Highlighter size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
          <Code size={15} />
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight size={15} />
        </ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
          <List size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote">
          <Quote size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
          <CodeSquare size={15} />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus size={15} />
        </ToolButton>
        <Divider />
        <ToolButton onClick={openImageModal} title="Insert Image (URL or Upload)">
          <ImageIcon size={15} />
        </ToolButton>
        <ToolButton onClick={addTable} title="Insert Table">
          <TableIcon size={15} />
        </ToolButton>
        {editor.isActive('table') && (
          <>
            <Divider />
            <ToolButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before">
              <ArrowLeft size={15} />
            </ToolButton>
            <ToolButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After">
              <ArrowRight size={15} />
            </ToolButton>
            <ToolButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before">
              <ArrowUp size={15} />
            </ToolButton>
            <ToolButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">
              <ArrowDown size={15} />
            </ToolButton>
            <ToolButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
              <Trash2 size={15} />
            </ToolButton>
          </>
        )}
      </div>

      {/* Editor Title */}
      <div className="px-8 sm:px-12 lg:px-16 pt-6 pb-0 bg-white dark:bg-neutral-950">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
          {activeFile.name}
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Last edited {new Date(activeFile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {showImageControls && imageControlsPos && (
        <div
          className="fixed z-40 flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
          style={{ top: imageControlsPos.top, left: imageControlsPos.left }}
        >
          <button
            onClick={() => setSelectedImageAlign('left')}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            onClick={() => setSelectedImageAlign('center')}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            onClick={() => setSelectedImageAlign('right')}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
          <button
            onClick={() => resizeSelectedImage(-IMAGE_STEP)}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Smaller"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => resizeSelectedImage(IMAGE_STEP)}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            title="Larger"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={deleteSelectedImage}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            title="Delete Image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <Modal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} title="Insert Image">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                if (imageError) setImageError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImageFromUrl();
                }
              }}
              placeholder="https://example.com/image.png"
              className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
            />
          </div>

          {imageError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {imageError}
            </div>
          )}

          <div className="flex justify-between gap-2">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Upload from Computer
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addImageFromUrl}
                className="px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Insert URL
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
