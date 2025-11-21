"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import type {
  IdeaDTO,
  DocumentDTO,
  IdeaWithDocumentsDTO,
} from "@/src/infrastructure/web/dto/IdeaDTO";
import {
  getIdeaWithDocuments,
  updateStatus,
  saveMetadata,
} from "@/features/idea-panel/api";
import { trackIdeaPanelView } from "@/features/idea-panel/analytics/tracking";

// Component imports
import IdeaPanelLayout from "./IdeaPanelLayout";
import IdeaDetailsSection from "./IdeaDetailsSection";
import DocumentsListSection from "./DocumentsListSection";
import ProjectStatusControl from "./ProjectStatusControl";
import AnalyzeButton from "./AnalyzeButton";
import NotesSection from "./NotesSection";
import TagsSection from "./TagsSection";

interface IdeaPanelViewProps {
  ideaId: string;
  initialData?: IdeaWithDocumentsDTO;
}

/**
 * IdeaPanelView component
 *
 * Main view component for the Idea Panel feature that integrates all sub-components:
 * - IdeaPanelLayout for overall structure
 * - IdeaDetailsSection for displaying idea information
 * - DocumentsListSection for showing associated analyses
 * - ProjectStatusControl for managing project status
 * - AnalyzeButton for creating new analyses
 * - TagsSection for managing tags
 *
 * Manages component state and data flow.
 *
 * Requirements: 1.3, 2.1, 3.1, 5.1, 10.1
 */
export const IdeaPanelView: React.FC<IdeaPanelViewProps> = ({
  ideaId,
  initialData,
}) => {
  const router = useRouter();
  const { t } = useLocale();

  // State management
  const [idea, setIdea] = useState<IdeaDTO | null>(initialData?.idea || null);
  const [documents, setDocuments] = useState<DocumentDTO[]>(
    initialData?.documents || []
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Load data if not provided initially
  useEffect(() => {
    if (!initialData && ideaId) {
      loadIdeaData();
    }
  }, [ideaId, initialData]);

  // Track panel view when data is loaded
  useEffect(() => {
    if (idea && documents) {
      trackIdeaPanelView({
        ideaId: idea.id,
        ideaSource: idea.source,
        projectStatus: idea.projectStatus,
        documentCount: documents.length,
        hasNotes: idea.notes.length > 0,
        tagCount: idea.tags.length,
      });
    }
  }, [idea, documents]);

  const loadIdeaData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getIdeaWithDocuments(ideaId);
      setIdea(data.idea);
      setDocuments(data.documents);
    } catch (err) {
      console.error("Failed to load idea:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("loadIdeaError") || "Failed to load idea"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    newStatus: IdeaDTO["projectStatus"]
  ): Promise<void> => {
    if (!idea) return;

    try {
      await updateStatus(ideaId, newStatus);

      // Optimistically update local state
      setIdea({
        ...idea,
        projectStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      throw err; // Re-throw to let component handle error display
    }
  };

  const handleSaveNotes = async (notes: string): Promise<void> => {
    if (!idea) return;

    try {
      await saveMetadata(ideaId, { notes });

      // Optimistically update local state
      setIdea({
        ...idea,
        notes,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
      throw err; // Re-throw to let component handle error display
    }
  };

  const handleSaveTags = async (tags: string[]): Promise<void> => {
    if (!idea) return;

    try {
      await saveMetadata(ideaId, { tags });

      // Optimistically update local state
      setIdea({
        ...idea,
        tags,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to save tags:", err);
      throw err; // Re-throw to let component handle error display
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <IdeaPanelLayout ideaId={ideaId}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 mx-auto mb-4 text-accent"
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
            <p className="text-lg text-slate-400 font-mono uppercase tracking-widest">
              {t("loadingIdea") || "Loading idea..."}
            </p>
          </div>
        </div>
      </IdeaPanelLayout>
    );
  }

  // Error state
  if (error || !idea) {
    return (
      <IdeaPanelLayout ideaId={ideaId}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto mb-4 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-red-400 mb-2 uppercase tracking-wider">
              {t("errorTitle") || "Error"}
            </h2>
            <p className="text-slate-400 mb-6 font-mono">
              {error || t("ideaNotFound") || "Idea not found"}
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-accent text-white font-bold rounded-none hover:bg-accent/90 transition-colors uppercase tracking-wider"
            >
              {t("backToDashboard") || "Back to Dashboard"}
            </button>
          </div>
        </div>
      </IdeaPanelLayout>
    );
  }

  // Main content
  return (
    <IdeaPanelLayout ideaId={ideaId}>
      <div className="space-y-6">
        {/* Idea Details Section */}
        <IdeaDetailsSection idea={idea} />

        {/* Documents List Section */}
        <DocumentsListSection documents={documents} ideaId={idea.id} />

        {/* Project Status Control */}
        <ProjectStatusControl idea={idea} onStatusUpdate={handleStatusUpdate} />

        {/* Analyze Button */}
        <div className="flex justify-center">
          <AnalyzeButton idea={idea} documentCount={documents.length} />
        </div>

        {/* Notes Section */}
        <NotesSection idea={idea} onSaveNotes={handleSaveNotes} />

        {/* Tags Section */}
        <TagsSection idea={idea} onSaveTags={handleSaveTags} />
      </div>
    </IdeaPanelLayout>
  );
};

export default IdeaPanelView;
