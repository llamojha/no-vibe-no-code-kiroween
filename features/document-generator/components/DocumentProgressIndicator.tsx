"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import {
  calculateProgress,
  getRecommendedNextDocument,
  hasDocumentType,
} from "@/lib/documents/progress";
import {
  getDocumentDisplayName,
  getDocumentColor,
  getDocumentIcon,
  getGeneratorRoute,
} from "@/lib/documents/utils";

/**
 * Document DTO interface for progress calculation
 */
interface DocumentDTO {
  documentType: string;
}

export interface DocumentProgressIndicatorProps {
  ideaId: string;
  documents: DocumentDTO[];
  className?: string;
}

/**
 * Workflow step configuration
 */
interface WorkflowStep {
  type: DocumentType | "analysis";
  label: string;
  icon: string;
  color: string;
  isAnalysis?: boolean;
}

/**
 * Get icon component based on icon name
 */
const getIconSvg = (iconName: string, className: string = "h-5 w-5") => {
  const icons: Record<string, React.ReactNode> = {
    chart: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
    "file-text": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    ),
    code: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    ),
    layers: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
    map: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return icons[iconName] || icons["file-text"];
};


/**
 * Get color classes based on color name
 */
const getColorClasses = (
  color: string,
  isCompleted: boolean,
  isRecommended: boolean
) => {
  const colorMap: Record<
    string,
    { bg: string; text: string; border: string; bgCompleted: string }
  > = {
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-400",
      border: "border-purple-500/50",
      bgCompleted: "bg-purple-500",
    },
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500/50",
      bgCompleted: "bg-blue-500",
    },
    green: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      border: "border-green-500/50",
      bgCompleted: "bg-green-500",
    },
    orange: {
      bg: "bg-orange-500/20",
      text: "text-orange-400",
      border: "border-orange-500/50",
      bgCompleted: "bg-orange-500",
    },
    gray: {
      bg: "bg-slate-500/20",
      text: "text-slate-400",
      border: "border-slate-500/50",
      bgCompleted: "bg-slate-500",
    },
  };

  const colors = colorMap[color] || colorMap.gray;

  if (isCompleted) {
    return {
      container: `${colors.bgCompleted} ${colors.border}`,
      text: "text-white",
      icon: "text-white",
    };
  }

  if (isRecommended) {
    return {
      container: `${colors.bg} ${colors.border} ring-2 ring-${color}-400/50`,
      text: colors.text,
      icon: colors.text,
    };
  }

  return {
    container: `bg-slate-800/50 border-slate-700`,
    text: "text-slate-500",
    icon: "text-slate-500",
  };
};

/**
 * DocumentProgressIndicator component
 *
 * Displays workflow steps (Analysis → PRD → Technical Design → Architecture → Roadmap)
 * with completion status, progress percentage, and next recommended document.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export const DocumentProgressIndicator: React.FC<
  DocumentProgressIndicatorProps
> = ({ ideaId, documents, className = "" }) => {
  const { t } = useLocale();
  const router = useRouter();

  // Calculate progress
  const progressPercentage = calculateProgress(documents);
  const recommendedNext = getRecommendedNextDocument(documents);

  // Check completion status for each step
  const hasAnalysis = documents.some(
    (d) =>
      d.documentType === "startup_analysis" ||
      d.documentType === "hackathon_analysis"
  );
  const hasPRD = hasDocumentType(documents, DocumentType.PRD);
  const hasTechnicalDesign = hasDocumentType(
    documents,
    DocumentType.TECHNICAL_DESIGN
  );
  const hasArchitecture = hasDocumentType(documents, DocumentType.ARCHITECTURE);
  const hasRoadmap = hasDocumentType(documents, DocumentType.ROADMAP);

  // Define workflow steps
  const workflowSteps: WorkflowStep[] = [
    {
      type: "analysis",
      label: t("analysisStep") || "Analysis",
      icon: "chart",
      color: "purple",
      isAnalysis: true,
    },
    {
      type: DocumentType.PRD,
      label: t("prdStep") || "PRD",
      icon: getDocumentIcon(DocumentType.PRD),
      color: getDocumentColor(DocumentType.PRD),
    },
    {
      type: DocumentType.TECHNICAL_DESIGN,
      label: t("technicalDesignStep") || "Technical Design",
      icon: getDocumentIcon(DocumentType.TECHNICAL_DESIGN),
      color: getDocumentColor(DocumentType.TECHNICAL_DESIGN),
    },
    {
      type: DocumentType.ARCHITECTURE,
      label: t("architectureStep") || "Architecture",
      icon: getDocumentIcon(DocumentType.ARCHITECTURE),
      color: getDocumentColor(DocumentType.ARCHITECTURE),
    },
    {
      type: DocumentType.ROADMAP,
      label: t("roadmapStep") || "Roadmap",
      icon: getDocumentIcon(DocumentType.ROADMAP),
      color: getDocumentColor(DocumentType.ROADMAP),
    },
  ];

  // Check if step is completed
  const isStepCompleted = (step: WorkflowStep): boolean => {
    if (step.isAnalysis) return hasAnalysis;
    if (step.type === DocumentType.PRD) return hasPRD;
    if (step.type === DocumentType.TECHNICAL_DESIGN) return hasTechnicalDesign;
    if (step.type === DocumentType.ARCHITECTURE) return hasArchitecture;
    if (step.type === DocumentType.ROADMAP) return hasRoadmap;
    return false;
  };

  // Check if step is recommended next
  const isStepRecommended = (step: WorkflowStep): boolean => {
    if (step.isAnalysis || !recommendedNext) return false;
    return (step.type as DocumentType).equals(recommendedNext);
  };

  const handleStepClick = (step: WorkflowStep): void => {
    if (step.isAnalysis) return;
    const route = getGeneratorRoute(step.type as DocumentType, ideaId);
    router.push(route);
  };

  return (
    <div
      className={`bg-gradient-to-br from-purple-900/40 to-black/60 border border-orange-500/30 rounded-none p-6 ${className}`}
      role="region"
      aria-label={t("documentProgressLabel") || "Document generation progress"}
    >
      {/* Header with progress percentage */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">
          {t("documentProgress") || "Document Progress"}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-2xl font-bold text-accent"
            aria-label={`${progressPercentage}% complete`}
          >
            {progressPercentage}%
          </span>
          <span className="text-sm text-slate-400 font-mono">
            {t("complete") || "complete"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 bg-slate-800 rounded-full mb-6 overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-gradient-to-r from-accent to-teal-400 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Workflow steps */}
      <div className="flex flex-wrap gap-3 justify-center">
        {workflowSteps.map((step, index) => {
          const isCompleted = isStepCompleted(step);
          const isRecommended = isStepRecommended(step);
          const isClickable = !step.isAnalysis;
          const colorClasses = getColorClasses(
            step.color,
            isCompleted,
            isRecommended
          );

          return (
            <React.Fragment key={step.label}>
              {/* Step indicator */}
              <button
                type="button"
                onClick={isClickable ? () => handleStepClick(step) : undefined}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-4 py-2 border rounded-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${colorClasses.container} ${
                  isClickable ? "cursor-pointer hover:opacity-90" : "cursor-default"
                }`}
                aria-label={`${step.label}: ${isCompleted ? t("completed") || "completed" : t("pending") || "pending"}${isRecommended ? ` - ${t("recommended") || "recommended"}` : ""}`}
                aria-disabled={!isClickable}
              >
                {/* Icon */}
                <div className={colorClasses.icon}>
                  {getIconSvg(step.icon, "h-5 w-5")}
                </div>

                {/* Label */}
                <span
                  className={`text-sm font-medium ${colorClasses.text} whitespace-nowrap`}
                >
                  {step.label}
                </span>

                {/* Completion checkmark */}
                {isCompleted && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {/* Recommended indicator */}
                {isRecommended && !isCompleted && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-mono uppercase">
                    {t("next") || "Next"}
                  </span>
                )}
              </button>

              {/* Arrow between steps */}
              {index < workflowSteps.length - 1 && (
                <div className="hidden sm:flex items-center text-slate-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Recommended next message */}
      {recommendedNext && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400 font-mono">
            <span className="text-accent">→</span>{" "}
            {t("recommendedNext") || "Recommended next"}:{" "}
            <span className="text-white font-medium">
              {getDocumentDisplayName(recommendedNext)}
            </span>
          </p>
        </div>
      )}

      {/* No analysis message */}
      {!hasAnalysis && (
        <div className="mt-4 text-center">
          <p className="text-sm text-amber-400/80 font-mono">
            <span className="mr-2">💡</span>
            {t("considerAnalysisFirst") ||
              "Consider creating an analysis first to get the most out of document generation"}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentProgressIndicator;
