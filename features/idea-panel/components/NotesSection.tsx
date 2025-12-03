"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type { IdeaDTO } from "@/src/infrastructure/web/dto/IdeaDTO";
import { trackNotesSave } from "@/features/idea-panel/analytics/tracking";

interface NotesSectionProps {
  idea: IdeaDTO;
  onSaveNotes: (notes: string) => Promise<void>;
}

/**
 * NotesSection component
 *
 * Provides interface for managing idea notes:
 * - Display notes textarea
 * - Enable save button on edit
 * - Handle save action
 * - Display previously saved notes
 *
 * Requirements: 4.1, 4.2, 4.5
 */
export const NotesSection: React.FC<NotesSectionProps> = ({
  idea,
  onSaveNotes,
}) => {
  const { t } = useLocale();
  const [notes, setNotes] = useState(idea.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when idea prop changes
  useEffect(() => {
    setNotes(idea.notes);
    setHasChanges(false);
  }, [idea.notes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    setHasChanges(newNotes !== idea.notes);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    const hadPreviousNotes = idea.notes.length > 0;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSaveNotes(notes);
      setHasChanges(false);
      setSaveSuccess(true);

      // Track notes save
      trackNotesSave({
        ideaId: idea.id,
        notesLength: notes.length,
        hadPreviousNotes,
        ideaSource: idea.source,
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save notes:", error);
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(idea.notes);
    setHasChanges(false);
    setSaveSuccess(false);
  };

  return (
    <section
      className="bg-primary/30 border border-slate-700 rounded-lg p-6 animate-fade-in"
      style={{ animationDelay: "200ms" }}
      aria-labelledby="notes-section-heading"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          id="notes-section-heading"
          className="text-lg font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary"
        >
          {t("notesTitle") || "Notes"}
        </h3>

        {/* Character count */}
        <span className="text-xs text-slate-500">
          {notes.length} / 10,000 {t("characters") || "characters"}
        </span>
      </div>

      {/* Notes textarea */}
      <div className="mb-4">
        <label htmlFor="idea-notes" className="sr-only">
          {t("notesLabel") || "Add notes about your idea"}
        </label>
        <textarea
          id="idea-notes"
          value={notes}
          onChange={handleNotesChange}
          placeholder={
            t("notesPlaceholder") ||
            "Add notes, thoughts, or progress updates about your idea..."
          }
          className="w-full min-h-[200px] px-4 py-3 bg-black/30 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y transition-all"
          maxLength={10000}
          aria-describedby="notes-help-text"
        />
        <p id="notes-help-text" className="text-xs text-slate-500 mt-2">
          {t("notesHelpText") ||
            "Use this space to capture thoughts, track progress, or document decisions about your idea."}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-accent text-accent rounded hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label={t("saveNotesButton") || "Save notes"}
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider border border-slate-600 text-slate-400 rounded hover:bg-slate-800/50 transition-colors"
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
            <span>{t("notesSaved") || "Notes saved successfully"}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default NotesSection;
