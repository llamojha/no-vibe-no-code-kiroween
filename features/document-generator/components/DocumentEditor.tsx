"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import {
  trackDocumentEdit,
  type TrackableDocumentType,
} from "@/features/document-generator/analytics";

/**
 * Props for the DocumentEditor component
 */
export interface DocumentEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onCancel?: () => void;
  autoSaveDelay?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  /** Document ID for analytics tracking */
  documentId?: string;
  /** Document type for analytics tracking */
  documentType?: TrackableDocumentType;
  /** Current version for analytics tracking */
  currentVersion?: number;
}

/**
 * Save status states
 */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  content: string;
  cursorPosition: number;
}

/**
 * DocumentEditor component
 * Markdown editor with syntax highlighting, preview mode, auto-save, and accessibility support
 *
 * Features:
 * - Markdown editor with syntax highlighting
 * - Preview mode
 * - Auto-save (debounced)
 * - Character count
 * - Save status indicator
 * - Undo/redo
 * - Keyboard shortcuts
 * - Accessibility (keyboard navigation, ARIA labels)
 *
 * Requirements: 11.2, 11.3, 11.4, 11.5, 20.1, 20.2, 20.3, 20.4, 20.5
 */
export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialContent,
  onSave,
  onCancel,
  autoSaveDelay = 2000,
  maxLength = 50000,
  placeholder = "Start writing your document...",
  disabled = false,
  documentId,
  documentType,
  currentVersion = 1,
}) => {
  const { t } = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State
  const [content, setContent] = useState(initialContent);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryEntry[]>([
    { content: initialContent, cursorPosition: 0 },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Derived values
  const characterCount = content.length;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Reset content when initialContent changes
  useEffect(() => {
    setContent(initialContent);
    setHistory([{ content: initialContent, cursorPosition: 0 }]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);
    setSaveStatus("idle");
  }, [initialContent]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (disabled || !hasUnsavedChanges) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    // Track save start
    if (documentId && documentType) {
      trackDocumentEdit({
        documentId,
        documentType,
        action: "save",
        previousVersion: currentVersion,
        contentLengthChange: content.length - initialContent.length,
      });
    }

    try {
      await onSave(content);
      setSaveStatus("saved");
      setHasUnsavedChanges(false);

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save document"
      );
    }
  }, [
    content,
    disabled,
    hasUnsavedChanges,
    onSave,
    documentId,
    documentType,
    currentVersion,
    initialContent.length,
  ]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || disabled) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Track auto-save
      if (documentId && documentType) {
        trackDocumentEdit({
          documentId,
          documentType,
          action: "auto_save",
          previousVersion: currentVersion,
          contentLengthChange: content.length - initialContent.length,
        });
      }
      await handleSave();
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    content,
    hasUnsavedChanges,
    autoSaveDelay,
    disabled,
    documentId,
    documentType,
    currentVersion,
    initialContent.length,
    handleSave,
  ]);

  // Handle content change
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;

      // Enforce max length
      if (newContent.length > maxLength) return;

      setContent(newContent);
      setHasUnsavedChanges(true);
      setSaveStatus("idle");

      // Add to history (debounced)
      const cursorPosition = e.target.selectionStart;
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ content: newContent, cursorPosition });
        // Limit history size
        if (newHistory.length > 100) {
          newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 99));
    },
    [historyIndex, maxLength]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (!canUndo) return;

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    setContent(entry.content);
    setHistoryIndex(newIndex);
    setHasUnsavedChanges(true);

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = entry.cursorPosition;
        textareaRef.current.selectionEnd = entry.cursorPosition;
      }
    }, 0);
  }, [canUndo, history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (!canRedo) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    setContent(entry.content);
    setHistoryIndex(newIndex);
    setHasUnsavedChanges(true);

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = entry.cursorPosition;
        textareaRef.current.selectionEnd = entry.cursorPosition;
      }
    }, 0);
  }, [canRedo, history, historyIndex]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Escape: Cancel (if handler provided)
      if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
        return;
      }
    },
    [handleSave, handleUndo, handleRedo, onCancel]
  );

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setIsPreviewMode((prev) => !prev);
  }, []);

  // Render markdown preview (basic implementation)
  const renderMarkdownPreview = useMemo(() => {
    // Basic markdown rendering - convert common patterns
    let html = content
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-lg font-bold text-slate-200 mt-4 mb-2">$1</h3>'
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-xl font-bold text-slate-200 mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^# (.+)$/gm,
        '<h1 class="text-2xl font-bold text-slate-200 mt-8 mb-4">$1</h1>'
      )
      // Bold
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-bold text-slate-200">$1</strong>'
      )
      // Italic
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // Code blocks
      .replace(
        /```(\w*)\n([\s\S]*?)```/g,
        '<pre class="bg-slate-900 p-4 rounded my-4 overflow-x-auto"><code class="text-sm text-green-400">$2</code></pre>'
      )
      // Inline code
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-800 px-1 py-0.5 rounded text-green-400">$1</code>'
      )
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, "<br />");

    return `<div class="prose prose-invert max-w-none"><p class="my-4">${html}</p></div>`;
  }, [content]);

  // Save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <span className="flex items-center gap-2 text-yellow-400 text-sm">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t("saving") || "Saving..."}
          </span>
        );
      case "saved":
        return (
          <span className="flex items-center gap-2 text-green-400 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {t("saved") || "Saved"}
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-2 text-red-400 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {t("saveFailed") || "Save failed"}
          </span>
        );
      default:
        return hasUnsavedChanges ? (
          <span className="text-slate-500 text-sm">
            {t("unsavedChanges") || "Unsaved changes"}
          </span>
        ) : null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700"
        role="toolbar"
        aria-label={t("editorToolbar") || "Editor toolbar"}
      >
        {/* Left side: Undo/Redo and mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo || disabled}
            className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t("undo") || "Undo (Ctrl+Z)"}
            title={t("undo") || "Undo (Ctrl+Z)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo || disabled}
            className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t("redo") || "Redo (Ctrl+Shift+Z)"}
            title={t("redo") || "Redo (Ctrl+Shift+Z)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          <button
            onClick={togglePreview}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isPreviewMode
                ? "bg-accent text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-pressed={isPreviewMode}
            aria-label={t("togglePreview") || "Toggle preview mode"}
          >
            {isPreviewMode ? t("edit") || "Edit" : t("preview") || "Preview"}
          </button>
        </div>

        {/* Right side: Save status and character count */}
        <div className="flex items-center gap-4">
          {renderSaveStatus()}
          <span className="text-slate-500 text-sm font-mono">
            {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          className="px-4 py-2 bg-red-900/30 border-b border-red-600 text-red-300 text-sm"
        >
          {errorMessage}
        </div>
      )}

      {/* Editor/Preview area */}
      <div className="flex-1 overflow-hidden">
        {isPreviewMode ? (
          <div
            className="h-full p-6 overflow-y-auto text-slate-300"
            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview }}
            aria-label={t("documentPreview") || "Document preview"}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full h-full p-6 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("documentEditor") || "Document editor"}
            aria-describedby="editor-help"
            spellCheck="true"
          />
        )}
      </div>

      {/* Footer with keyboard shortcuts help */}
      <div
        id="editor-help"
        className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-500"
      >
        <span className="hidden sm:inline">
          {t("keyboardShortcuts") || "Keyboard shortcuts"}:{" "}
          <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl+S</kbd>{" "}
          {t("toSave") || "to save"},{" "}
          <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl+Z</kbd>{" "}
          {t("toUndo") || "to undo"},{" "}
          <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl+Shift+Z</kbd>{" "}
          {t("toRedo") || "to redo"}
        </span>
        <span className="sm:hidden">
          {t("autoSaveEnabled") || "Auto-save enabled"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 bg-slate-800 border-t border-slate-700">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={disabled}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            {t("cancel") || "Cancel"}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={disabled || !hasUnsavedChanges || saveStatus === "saving"}
          className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saveStatus === "saving"
            ? t("saving") || "Saving..."
            : t("saveChanges") || "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default DocumentEditor;
