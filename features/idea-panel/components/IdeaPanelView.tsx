"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { isEnabled } from "@/lib/featureFlags";
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
import { generateDocument } from "@/features/idea-panel/api/documentGeneration";

// Component imports
import IdeaPanelLayout from "./IdeaPanelLayout";
import IdeaDetailsSection from "./IdeaDetailsSection";
import DocumentsListSection from "./DocumentsListSection";
import ProjectStatusControl from "./ProjectStatusControl";
import AnalyzeButton from "./AnalyzeButton";
import NotesSection from "./NotesSection";
import TagsSection from "./TagsSection";
import DeleteIdeaButton from "./DeleteIdeaButton";
import ExportToKiroButton from "./ExportToKiroButton";
import ExportOptionsModal from "./ExportOptionsModal";
import PostExportSuccessModal from "./PostExportSuccessModal";
import KiroGettingStartedPanel from "./KiroGettingStartedPanel";

// Document generator component imports
import {
  DocumentProgressIndicator,
  GeneratePRDButton,
  GenerateTechnicalDesignButton,
  GenerateArchitectureButton,
  GenerateRoadmapButton,
  DocumentCard,
} from "@/features/document-generator/components";
import {
  exportDocument,
  downloadExportedDocument,
} from "@/features/idea-panel/api";

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
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isQuickGenerating, setIsQuickGenerating] = useState<
    null | "prd" | "technical_design" | "architecture" | "roadmap"
  >(null);
  const [quickGenerateError, setQuickGenerateError] = useState<string | null>(
    null
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPostExportModalOpen, setIsPostExportModalOpen] = useState(false);
  const [hasExportedToKiro, setHasExportedToKiro] = useState(false);
  const [firstFeatureName, setFirstFeatureName] =
    useState<string>("your first feature");
  const [showGettingStartedPanel, setShowGettingStartedPanel] = useState(true);

  // Define loadIdeaData before useEffects that depend on it
  const loadIdeaData = React.useCallback(async () => {
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
  }, [ideaId, t]);

  // Load data if not provided initially
  useEffect(() => {
    if (!initialData && ideaId) {
      loadIdeaData();
    }
  }, [ideaId, initialData, loadIdeaData]);

  // Refresh data when page becomes visible (handles browser back navigation)
  // This ensures newly generated documents are displayed after navigation
  // Requirements: 2.5, 4.5, 6.5, 8.5
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && ideaId) {
        loadIdeaData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ideaId, loadIdeaData]);

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

  // Check if document generation feature is enabled
  const isDocumentGenerationEnabled = isEnabled("ENABLE_DOCUMENT_GENERATION");

  // Separate analysis documents from generated documents
  const analysisDocuments = documents.filter(
    (doc) =>
      doc.documentType === "startup_analysis" ||
      doc.documentType === "hackathon_analysis"
  );
  const generatedDocuments = documents.filter(
    (doc) =>
      doc.documentType === "prd" ||
      doc.documentType === "technical_design" ||
      doc.documentType === "architecture" ||
      doc.documentType === "roadmap"
  );

  const missingDocumentTypes: Array<
    "prd" | "technical_design" | "architecture" | "roadmap"
  > = ["prd", "technical_design", "architecture", "roadmap"].filter(
    (type): type is "prd" | "technical_design" | "architecture" | "roadmap" =>
      !generatedDocuments.some((doc) => doc.documentType === type)
  );

  // Handlers for document actions
  const handleEditDocument = (documentId: string) => {
    // Navigate to document editor (to be implemented)
    console.log("Edit document:", documentId);
    // TODO: Implement document editing navigation
  };

  const handleRegenerateDocument = (documentId: string) => {
    const doc = documents.find((d) => d.id === documentId);
    if (doc) {
      // Navigate to generator page for regeneration
      router.push(`/generate/${doc.documentType.replace("_", "-")}/${ideaId}`);
    }
  };

  const handleViewVersions = (documentId: string) => {
    // Open version history modal (to be implemented)
    console.log("View versions:", documentId);
    // TODO: Implement version history modal
  };

  const handleExportDocument = async (documentId: string) => {
    try {
      setExportError(null);
      const result = await exportDocument(documentId, "markdown");
      downloadExportedDocument(result);
    } catch (err) {
      console.error("Failed to export document:", err);
      setExportError(
        err instanceof Error
          ? err.message
          : t("exportFailed") || "Failed to export document"
      );
    }
  };

  const handleExportAllDocuments = async () => {
    if (!documents.length) return;
    setIsExportingAll(true);
    setExportError(null);

    try {
      for (const doc of documents) {
        const result = await exportDocument(doc.id, "markdown");
        downloadExportedDocument(result);
      }
    } catch (err) {
      console.error("Failed to export all documents:", err);
      setExportError(
        err instanceof Error
          ? err.message
          : t("exportFailed") || "Failed to export documents"
      );
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExportSuccess = (featureName: string) => {
    setFirstFeatureName(featureName);
    setHasExportedToKiro(true);
    setIsPostExportModalOpen(true);
  };

  const handleQuickGenerate = async (
    documentType: "prd" | "technical_design" | "architecture" | "roadmap"
  ) => {
    if (isQuickGenerating) return;
    setQuickGenerateError(null);
    setIsQuickGenerating(documentType);
    try {
      const generated = await generateDocument({
        ideaId,
        documentType,
      });
      setDocuments((prev) => [
        generated,
        ...prev.filter((d) => d.id !== generated.id),
      ]);
    } catch (err) {
      console.error("Quick generate failed:", err);
      setQuickGenerateError(
        err instanceof Error
          ? err.message
          : t("generationFailedFallback") ||
              "Failed to generate document. Please try again."
      );
    } finally {
      setIsQuickGenerating(null);
    }
  };

  // Main content
  return (
    <IdeaPanelLayout ideaId={ideaId}>
      <div className="space-y-6">
        {/* Idea Details Section */}
        <IdeaDetailsSection idea={idea} />

        {/* Document Progress Indicator - Requirements: 9.1 */}
        {isDocumentGenerationEnabled && (
          <DocumentProgressIndicator ideaId={idea.id} documents={documents} />
        )}

        {/* Kiro Getting Started Panel - Shows after export */}
        {hasExportedToKiro && showGettingStartedPanel && (
          <KiroGettingStartedPanel
            hasExported={hasExportedToKiro}
            firstFeatureName={firstFeatureName}
            onDismiss={() => setShowGettingStartedPanel(false)}
          />
        )}

        {/* Document Generation Buttons Section - Requirements: 1.1, 3.1, 5.1, 7.1 */}
        {isDocumentGenerationEnabled && (
          <section
            className="bg-primary/30 border border-slate-700 p-6 animate-fade-in"
            aria-labelledby="generate-documents-heading"
          >
            <h2
              id="generate-documents-heading"
              className="text-xl font-bold border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider mb-6"
            >
              {t("generateDocuments") || "Generate Documents"}
            </h2>
            <p className="text-sm text-slate-400 mb-4 font-mono">
              {t("generateDocumentsDescription") ||
                "Create AI-powered project documentation from your idea"}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <GeneratePRDButton ideaId={idea.id} variant="compact" />
              <GenerateTechnicalDesignButton
                ideaId={idea.id}
                variant="compact"
              />
              <GenerateArchitectureButton ideaId={idea.id} variant="compact" />
              <GenerateRoadmapButton ideaId={idea.id} variant="compact" />
            </div>
          </section>
        )}

        {/* Missing Documents Quick Generate */}
        {isDocumentGenerationEnabled && missingDocumentTypes.length > 0 && (
          <section
            className="bg-secondary/10 border border-secondary/40 p-6 animate-fade-in"
            aria-labelledby="missing-documents-heading"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <h3
                  id="missing-documents-heading"
                  className="text-lg font-bold text-secondary uppercase tracking-wider"
                >
                  {t("missingDocsTitle") || "Missing documents"}
                </h3>
                <p className="text-sm text-slate-300">
                  {t("missingDocsSubtitle") ||
                    "Generate the next documents with one click to keep the flow moving."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {missingDocumentTypes.map((type) => {
                const labelMap = {
                  prd: t("generatePRD"),
                  technical_design: t("generateTechnicalDesign"),
                  architecture: t("generateArchitecture"),
                  roadmap: t("generateRoadmap"),
                };
                const isBusy = isQuickGenerating === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleQuickGenerate(type)}
                    disabled={isBusy}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border transition-colors ${
                      isBusy
                        ? "bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-secondary/80 border-secondary/50 text-slate-900 hover:bg-secondary hover:border-secondary/80"
                    }`}
                  >
                    {isBusy ? (
                      <svg
                        className="h-4 w-4 animate-spin"
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
                    ) : null}
                    <span>{labelMap[type]}</span>
                  </button>
                );
              })}
            </div>
            {quickGenerateError && (
              <div
                className="mt-3 p-3 border border-red-500/60 bg-red-900/30 text-red-200 text-sm rounded-md"
                role="alert"
              >
                {quickGenerateError}
              </div>
            )}
          </section>
        )}

        {/* Generated Documents Section - Requirements: 10.1, 10.2 */}
        {isDocumentGenerationEnabled && generatedDocuments.length > 0 && (
          <section
            className="bg-primary/30 border border-slate-700 p-6 animate-fade-in"
            aria-labelledby="generated-documents-heading"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700 pb-2 mb-4">
              <h2
                id="generated-documents-heading"
                className="text-xl font-bold text-slate-200 uppercase tracking-wider"
              >
                {t("generatedDocuments") || "Generated Documents"}{" "}
                <span className="text-slate-500">
                  ({generatedDocuments.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {/* Export to Kiro Button - Requirements: 1.1, 1.5 */}
                <ExportToKiroButton
                  ideaId={idea.id}
                  ideaName={idea.ideaText.substring(0, 50)}
                  documents={documents}
                  onExportClick={() => setIsExportModalOpen(true)}
                />
                <button
                  onClick={handleExportAllDocuments}
                  disabled={isExportingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white text-sm font-semibold uppercase tracking-wider rounded-none transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ${
                      isExportingAll ? "animate-spin" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h8a1 1 0 01.707.293l4 4A1 1 0 0117 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 5a1 1 0 011-1h6a1 1 0 110 2H6a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H6a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    {isExportingAll ? t("exporting") : t("exportAll")}
                  </span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {generatedDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  ideaId={idea.id}
                  onView={handleEditDocument}
                  onRegenerate={handleRegenerateDocument}
                  onViewVersions={handleViewVersions}
                  onExport={handleExportDocument}
                  showExpandToggle={false}
                  viewLabel="View / Edit"
                />
              ))}
            </div>

            {exportError && (
              <div
                className="mt-4 p-3 border border-red-500/60 bg-red-900/30 text-red-200 text-sm rounded-none"
                role="alert"
                aria-live="assertive"
              >
                {exportError}
              </div>
            )}
          </section>
        )}

        {/* Analysis Documents List Section (existing analyses) */}
        <DocumentsListSection documents={analysisDocuments} ideaId={idea.id} />

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

        {/* Delete Button */}
        <div className="flex justify-center pt-6 border-t border-slate-700">
          <DeleteIdeaButton
            ideaId={idea.id}
            ideaText={idea.ideaText}
            variant="panel"
          />
        </div>
      </div>

      {/* Export Options Modal - Requirements: 13.1, 13.2, 13.3 */}
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        ideaId={idea.id}
        ideaName={idea.ideaText.substring(0, 50)}
        documents={documents}
        onExportSuccess={handleExportSuccess}
      />

      {/* Post-Export Success Modal - Shows next steps after successful export */}
      <PostExportSuccessModal
        isOpen={isPostExportModalOpen}
        onClose={() => setIsPostExportModalOpen(false)}
        firstFeatureName={firstFeatureName}
        exportFormat="zip"
      />
    </IdeaPanelLayout>
  );
};

export default IdeaPanelView;
