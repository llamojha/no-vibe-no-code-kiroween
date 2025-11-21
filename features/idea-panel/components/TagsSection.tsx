"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { IdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";

interface TagsSectionProps {
  idea: IdeaDTO;
  onSaveTags: (tags: string[]) => Promise<void>;
}

/**
 * TagsSection component
 *
 * Provides interface for managing idea tags:
 * - Display tags list
 * - Provide add tag input
 * - Provide remove tag buttons
 * - Handle tag save action
 * - Display previously saved tags
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
export const TagsSection: React.FC<TagsSectionProps> = ({
  idea,
  onSaveTags,
}) => {
  const { t } = useLocale();
  const [tags, setTags] = useState<string[]>(idea.tags);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when idea prop changes
  useEffect(() => {
    setTags(idea.tags);
    setHasChanges(false);
  }, [idea.tags]);

  // Check if tags have changed
  useEffect(() => {
    const tagsChanged =
      tags.length !== idea.tags.length ||
      tags.some((tag, index) => tag !== idea.tags[index]);
    setHasChanges(tagsChanged);
  }, [tags, idea.tags]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();

    // Validation
    if (!trimmedTag) {
      setError(t("tagEmptyError") || "Tag cannot be empty");
      return;
    }

    if (trimmedTag.length > 50) {
      setError(t("tagTooLongError") || "Tag cannot exceed 50 characters");
      return;
    }

    if (tags.includes(trimmedTag)) {
      setError(t("tagDuplicateError") || "Tag already exists");
      return;
    }

    if (tags.length >= 50) {
      setError(t("tagLimitError") || "Cannot have more than 50 tags");
      return;
    }

    // Add tag
    setTags([...tags, trimmedTag]);
    setNewTag("");
    setError(null);
    setSaveSuccess(false);

    // Focus back on input
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setError(null);
    setSaveSuccess(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      await onSaveTags(tags);
      setHasChanges(false);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save tags:", error);
      setError(
        error instanceof Error
          ? error.message
          : t("tagsSaveError") || "Failed to save tags"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTags(idea.tags);
    setNewTag("");
    setHasChanges(false);
    setSaveSuccess(false);
    setError(null);
  };

  return (
    <section
      className="bg-primary/30 border border-slate-700 p-6 animate-fade-in"
      style={{ animationDelay: "300ms" }}
      aria-labelledby="tags-section-heading"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          id="tags-section-heading"
          className="text-lg font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider"
        >
          {t("tagsTitle") || "Tags"}
        </h3>

        {/* Tag count */}
        <span className="text-xs text-slate-500 font-mono">
          {tags.length} / 50 {t("tags") || "tags"}
        </span>
      </div>

      {/* Add tag input */}
      <div className="mb-4">
        <label htmlFor="new-tag-input" className="sr-only">
          {t("addTagLabel") || "Add a new tag"}
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="new-tag-input"
            type="text"
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder={t("tagPlaceholder") || "Add a tag..."}
            className="flex-1 px-4 py-2 bg-primary/50 border border-slate-700 rounded-none text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
            maxLength={50}
            disabled={tags.length >= 50}
            aria-describedby="tag-help-text"
          />
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim() || tags.length >= 50}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-accent text-accent rounded-none hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label={t("addTagButton") || "Add tag"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">{t("addButton") || "Add"}</span>
          </button>
        </div>
        <p id="tag-help-text" className="text-xs text-slate-500 mt-2 font-mono">
          {t("tagHelpText") ||
            "Use tags to categorize and organize your ideas. Press Enter to add."}
        </p>

        {/* Error message */}
        {error && (
          <div
            className="flex items-center gap-2 text-red-400 text-sm mt-2 animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
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
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tags display */}
      <div className="mb-4">
        {tags.length === 0 ? (
          <div className="bg-primary/30 border border-dashed border-slate-700 p-8 text-center text-slate-500 font-mono uppercase tracking-widest">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-3 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="text-sm">
              {t("noTagsMessage") ||
                "No tags yet. Add some to organize your idea!"}
            </p>
          </div>
        ) : (
          <div
            className="flex flex-wrap gap-2"
            role="list"
            aria-label={t("tagsListLabel") || "Current tags"}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/20 border border-accent/50 rounded text-sm text-accent group hover:bg-accent/30 transition-colors"
                role="listitem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium uppercase tracking-wider">
                  {tag}
                </span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded-none"
                  aria-label={`${t("removeTagButton") || "Remove tag"} ${tag}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-accent text-accent rounded-none hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label={t("saveTagsButton") || "Save tags"}
        >
          {isSaving ? (
            <>
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
              <span>{t("saving") || "Saving..."}</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              <span>{t("saveButton") || "Save"}</span>
            </>
          )}
        </button>

        {hasChanges && !isSaving && (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-slate-600 text-slate-400 rounded-none hover:bg-slate-800/50 transition-colors"
            aria-label={t("cancelButton") || "Cancel changes"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t("cancelButton") || "Cancel"}</span>
          </button>
        )}

        {/* Success message */}
        {saveSuccess && (
          <div
            className="flex items-center gap-2 text-green-400 text-sm animate-fade-in"
            role="status"
            aria-live="polite"
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
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t("tagsSaved") || "Tags saved successfully"}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default TagsSection;
