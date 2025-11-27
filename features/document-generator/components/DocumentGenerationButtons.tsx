"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/features/locale/context/LocaleContext";
import { isEnabled } from "@/lib/featureFlags";
import { initFeatureFlags } from "@/lib/featureFlags.config";
import { DocumentType } from "@/src/domain/value-objects/DocumentType";
import {
  getDocumentDisplayName,
  getDocumentCreditCost,
  getDocumentColor,
  getGeneratorRoute,
} from "@/lib/documents/utils";

// Ensure feature flags are registered on the client before any checks
initFeatureFlags();

export interface DocumentGenerationButtonProps {
  ideaId: string;
  className?: string;
  variant?: "default" | "compact";
}

/**
 * Get icon component based on document type
 */
const getDocumentTypeIcon = (
  documentType: DocumentType,
  className: string = "h-5 w-5"
) => {
  const icons: Record<string, React.ReactNode> = {
    prd: (
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
    technical_design: (
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
    architecture: (
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
    roadmap: (
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

  return icons[documentType.value] || icons.prd;
};

/**
 * Get color classes based on document type color
 */
const getButtonColorClasses = (color: string) => {
  const colorMap: Record<
    string,
    { bg: string; hover: string; shadow: string }
  > = {
    blue: {
      bg: "bg-blue-600",
      hover: "hover:bg-blue-500",
      shadow: "shadow-blue-600/30",
    },
    purple: {
      bg: "bg-purple-600",
      hover: "hover:bg-purple-500",
      shadow: "shadow-purple-600/30",
    },
    green: {
      bg: "bg-green-600",
      hover: "hover:bg-green-500",
      shadow: "shadow-green-600/30",
    },
    orange: {
      bg: "bg-orange-600",
      hover: "hover:bg-orange-500",
      shadow: "shadow-orange-600/30",
    },
  };

  return colorMap[color] || colorMap.blue;
};

/**
 * Base document generation button component
 * All buttons are always enabled - users can generate any document at any time
 */
interface BaseDocumentGenerationButtonProps
  extends DocumentGenerationButtonProps {
  documentType: DocumentType;
  label: string;
}

const BaseDocumentGenerationButton: React.FC<
  BaseDocumentGenerationButtonProps
> = ({ ideaId, documentType, label, className = "", variant = "default" }) => {
  const router = useRouter();
  const { t } = useLocale();
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);

  // Check feature flag on mount
  useEffect(() => {
    setIsFeatureEnabled(isEnabled("ENABLE_DOCUMENT_GENERATION"));
  }, []);

  // Hide button when feature flag is disabled
  if (!isFeatureEnabled) {
    return null;
  }

  const creditCost = getDocumentCreditCost(documentType);
  const color = getDocumentColor(documentType);
  const colorClasses = getButtonColorClasses(color);
  const route = getGeneratorRoute(documentType, ideaId);

  const handleClick = () => {
    router.push(route);
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2 ${colorClasses.bg} ${colorClasses.hover} text-white font-medium text-sm rounded-none shadow-lg ${colorClasses.shadow} transform hover:scale-105 transition-all duration-300 ease-in-out ${className}`}
        aria-label={`${label} - ${creditCost} ${t("credits")}`}
      >
        {getDocumentTypeIcon(documentType, "h-4 w-4")}
        <span>{label}</span>
        <span className="text-xs opacity-75">({creditCost})</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 px-6 py-3 ${colorClasses.bg} ${colorClasses.hover} text-white font-bold rounded-none shadow-lg ${colorClasses.shadow} transform hover:scale-105 transition-all duration-300 ease-in-out uppercase tracking-wider ${className}`}
      aria-label={`${label} - ${creditCost} ${t("credits")}`}
    >
      {getDocumentTypeIcon(documentType, "h-5 w-5")}
      <div className="flex flex-col items-start">
        <span className="text-sm">{label}</span>
        <span className="text-xs opacity-75 font-mono normal-case">
          {creditCost} {t("credits")}
        </span>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 ml-2"
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
  );
};

/**
 * GeneratePRDButton component
 *
 * Button to navigate to PRD generator page.
 * Always enabled - users can generate any document at any time.
 * Hidden when ENABLE_DOCUMENT_GENERATION feature flag is disabled.
 *
 * Requirements: 1.1, 1.2, 21.1, 21.3
 */
export const GeneratePRDButton: React.FC<DocumentGenerationButtonProps> = (
  props
) => {
  const { t } = useLocale();
  return (
    <BaseDocumentGenerationButton
      {...props}
      documentType={DocumentType.PRD}
      label={t("generatePRD")}
    />
  );
};

/**
 * GenerateTechnicalDesignButton component
 *
 * Button to navigate to Technical Design generator page.
 * Always enabled - users can generate any document at any time.
 * Hidden when ENABLE_DOCUMENT_GENERATION feature flag is disabled.
 *
 * Requirements: 3.1, 3.2, 21.1, 21.3
 */
export const GenerateTechnicalDesignButton: React.FC<
  DocumentGenerationButtonProps
> = (props) => {
  const { t } = useLocale();
  return (
    <BaseDocumentGenerationButton
      {...props}
      documentType={DocumentType.TECHNICAL_DESIGN}
      label={t("generateTechnicalDesign")}
    />
  );
};

/**
 * GenerateArchitectureButton component
 *
 * Button to navigate to Architecture generator page.
 * Always enabled - users can generate any document at any time.
 * Hidden when ENABLE_DOCUMENT_GENERATION feature flag is disabled.
 *
 * Requirements: 5.1, 5.2, 21.1, 21.3
 */
export const GenerateArchitectureButton: React.FC<
  DocumentGenerationButtonProps
> = (props) => {
  const { t } = useLocale();
  return (
    <BaseDocumentGenerationButton
      {...props}
      documentType={DocumentType.ARCHITECTURE}
      label={t("generateArchitecture")}
    />
  );
};

/**
 * GenerateRoadmapButton component
 *
 * Button to navigate to Roadmap generator page.
 * Always enabled - users can generate any document at any time.
 * Hidden when ENABLE_DOCUMENT_GENERATION feature flag is disabled.
 *
 * Requirements: 7.1, 7.2, 21.1, 21.3
 */
export const GenerateRoadmapButton: React.FC<DocumentGenerationButtonProps> = (
  props
) => {
  const { t } = useLocale();
  return (
    <BaseDocumentGenerationButton
      {...props}
      documentType={DocumentType.ROADMAP}
      label={t("generateRoadmap")}
    />
  );
};

export default {
  GeneratePRDButton,
  GenerateTechnicalDesignButton,
  GenerateArchitectureButton,
  GenerateRoadmapButton,
};
