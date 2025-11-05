"use client";

import React, { useState, useCallback } from "react";
import { ProjectSubmission, KiroweenCategory } from "@/lib/types";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface ProjectSubmissionFormProps {
  submission: ProjectSubmission;
  onSubmissionChange: (submission: ProjectSubmission) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

interface FormErrors {
  description?: string;
  selectedCategory?: string;
  kiroUsage?: string;
}

const getCategoryOptions = (
  t: (key: string) => string
): { value: KiroweenCategory; label: string; description: string }[] => [
  {
    value: "resurrection",
    label: `🧟 ${t("categoryResurrection")}`,
    description: t("categoryResurrectionDescription"),
  },
  {
    value: "frankenstein",
    label: `⚡ ${t("categoryFrankenstein")}`,
    description: t("categoryFrankensteinDescription"),
  },
  {
    value: "skeleton-crew",
    label: `💀 ${t("categorySkeletonCrew")}`,
    description: t("categorySkeletonCrewDescription"),
  },
  {
    value: "costume-contest",
    label: `🎭 ${t("categoryCostumeContest")}`,
    description: t("categoryCostumeContestDescription"),
  },
];

const ProjectSubmissionForm: React.FC<ProjectSubmissionFormProps> = ({
  submission,
  onSubmissionChange,
  onAnalyze,
  isLoading,
}) => {
  const { t } = useLocale();
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSupportingMaterials, setShowSupportingMaterials] = useState(false);

  const CATEGORY_OPTIONS = getCategoryOptions(t);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!submission.description.trim()) {
      newErrors.description = t("projectDescriptionRequired");
    } else if (submission.description.trim().length < 50) {
      newErrors.description = t("projectDescriptionMinLength");
    }

    if (!submission.selectedCategory) {
      newErrors.selectedCategory = t("categorySelectionRequired");
    }

    if (!submission.kiroUsage.trim()) {
      newErrors.kiroUsage = t("kiroUsageRequired");
    } else if (submission.kiroUsage.trim().length < 20) {
      newErrors.kiroUsage = t("kiroUsageMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [submission]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (validateForm()) {
        onAnalyze();
      }
    },
    [onAnalyze, validateForm]
  );

  const updateSubmission = useCallback(
    (updates: Partial<ProjectSubmission>) => {
      onSubmissionChange({ ...submission, ...updates });
      // Clear related errors when user starts typing
      const newErrors = { ...errors };
      Object.keys(updates).forEach((key) => {
        delete newErrors[key as keyof FormErrors];
      });
      setErrors(newErrors);
    },
    [submission, onSubmissionChange, errors]
  );

  const updateSupportingMaterials = useCallback(
    (
      updates: Partial<NonNullable<ProjectSubmission["supportingMaterials"]>>
    ) => {
      const currentMaterials = submission.supportingMaterials || {};
      updateSubmission({
        supportingMaterials: { ...currentMaterials, ...updates },
      });
    },
    [submission.supportingMaterials, updateSubmission]
  );

  return (
    <div className="bg-gradient-to-br from-black via-purple-950/20 to-orange-950/20 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-orange-500/30 animate-slide-in-up relative overflow-hidden">
      {/* Spooky background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ff6b35%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M30%2030c0-11.046-8.954-20-20-20s-20%208.954-20%2020%208.954%2020%2020%2020%2020-8.954%2020-20zm0%200c0%2011.046%208.954%2020%2020%2020s20-8.954%2020-20-8.954-20-20-20-20%208.954-20%2020z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />

      {/* Floating ghost animation */}
      <div className="absolute top-4 right-4 text-orange-400/20 animate-bounce">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.686 2 6 4.686 6 8v8c0 1.105.895 2 2 2h1l1-2h4l1 2h1c1.105 0 2-.895 2-2V8c0-3.314-2.686-6-6-6zM9 9c0-.552.448-1 1-1s1 .448 1 1-.448 1-1 1-1-.448-1-1zm4 0c0-.552.448-1 1-1s1 .448 1 1-.448 1-1 1-1-.448-1-1z" />
        </svg>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-orange-400 mb-2 tracking-wider uppercase">
            🎃 {t("kiroweenAnalyzerTitle")}
          </h2>
          <p className="text-slate-300 text-sm">
            {t("kiroweenAnalyzerSubtitle")}
          </p>
        </div>

        {/* Project Description */}
        <div className="mb-6">
          <label
            htmlFor="project-description"
            className="block text-lg font-semibold text-orange-300 mb-3 uppercase tracking-wider"
          >
            👻 {t("projectDescriptionLabel")} *
          </label>
          <textarea
            id="project-description"
            rows={6}
            className={`w-full p-4 bg-black/70 border-2 rounded-lg focus:outline-none focus:ring-2 transition duration-300 placeholder-slate-500 text-slate-100 font-mono resize-none ${
              errors.description
                ? "border-red-500 focus:ring-red-500/50"
                : "border-orange-500/50 focus:ring-orange-500/50 focus:border-orange-400"
            }`}
            placeholder={t("projectDescriptionPlaceholder")}
            value={submission.description}
            onChange={(e) => updateSubmission({ description: e.target.value })}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-2 text-red-400 text-sm flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.description}
            </p>
          )}
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <label
            htmlFor="category-selection"
            className="block text-lg font-semibold text-orange-300 mb-3 uppercase tracking-wider"
          >
            🏆 {t("categorySelectionLabel")} *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  submission.selectedCategory === option.value
                    ? "border-orange-400 bg-orange-500/20 shadow-lg shadow-orange-500/20"
                    : "border-purple-500/50 bg-purple-950/20 hover:border-purple-400"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  checked={submission.selectedCategory === option.value}
                  onChange={(e) =>
                    updateSubmission({
                      selectedCategory: e.target.value as KiroweenCategory,
                    })
                  }
                  className="sr-only"
                  disabled={isLoading}
                />
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-300 mb-2">
                    {option.label}
                  </div>
                  <div className="text-sm text-slate-300">
                    {option.description}
                  </div>
                </div>
                {submission.selectedCategory === option.value && (
                  <div className="absolute top-2 right-2 text-orange-400">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
          {errors.selectedCategory && (
            <p className="mt-2 text-red-400 text-sm flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.selectedCategory}
            </p>
          )}
        </div>

        {/* Kiro Usage */}
        <div className="mb-6">
          <label
            htmlFor="kiro-usage"
            className="block text-lg font-semibold text-orange-300 mb-3 uppercase tracking-wider"
          >
            🤖 {t("kiroUsageLabel")} *
          </label>
          <textarea
            id="kiro-usage"
            rows={4}
            className={`w-full p-4 bg-black/70 border-2 rounded-lg focus:outline-none focus:ring-2 transition duration-300 placeholder-slate-500 text-slate-100 font-mono resize-none ${
              errors.kiroUsage
                ? "border-red-500 focus:ring-red-500/50"
                : "border-green-500/50 focus:ring-green-500/50 focus:border-green-400"
            }`}
            placeholder={t("kiroUsagePlaceholder")}
            value={submission.kiroUsage}
            onChange={(e) => updateSubmission({ kiroUsage: e.target.value })}
            disabled={isLoading}
          />
          {errors.kiroUsage && (
            <p className="mt-2 text-red-400 text-sm flex items-center">
              <span className="mr-1">⚠️</span>
              {errors.kiroUsage}
            </p>
          )}
        </div>

        {/* Supporting Materials Toggle */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowSupportingMaterials(!showSupportingMaterials)}
            className="flex items-center text-purple-300 hover:text-purple-200 transition-colors duration-200"
            disabled={isLoading}
          >
            <span className="mr-2">📎</span>
            <span className="font-semibold">
              {t("supportingMaterialsLabel")}
            </span>
            <svg
              className={`w-5 h-5 ml-2 transition-transform duration-200 ${
                showSupportingMaterials ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Supporting Materials Section */}
        {showSupportingMaterials && (
          <div className="mb-6 p-4 bg-purple-950/30 rounded-lg border border-purple-500/30">
            <div className="space-y-4">
              {/* Demo Link */}
              <div>
                <label
                  htmlFor="demo-link"
                  className="block text-sm font-semibold text-purple-300 mb-2"
                >
                  🔗 {t("demoLinkLabel")}
                </label>
                <input
                  id="demo-link"
                  type="url"
                  className="w-full p-3 bg-black/50 border border-purple-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition duration-300 placeholder-slate-500 text-slate-100"
                  placeholder="https://your-demo-link.com"
                  value={submission.supportingMaterials?.demoLink || ""}
                  onChange={(e) =>
                    updateSupportingMaterials({ demoLink: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label
                  htmlFor="additional-notes"
                  className="block text-sm font-semibold text-purple-300 mb-2"
                >
                  📝 {t("additionalNotesLabel")}
                </label>
                <textarea
                  id="additional-notes"
                  rows={3}
                  className="w-full p-3 bg-black/50 border border-purple-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition duration-300 placeholder-slate-500 text-slate-100 resize-none"
                  placeholder="Any additional information about your project..."
                  value={submission.supportingMaterials?.additionalNotes || ""}
                  onChange={(e) =>
                    updateSupportingMaterials({
                      additionalNotes: e.target.value,
                    })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isLoading ||
            !submission.description.trim() ||
            !submission.selectedCategory ||
            !submission.kiroUsage.trim()
          }
          className="relative w-full flex justify-center items-center px-8 py-4 border-2 border-orange-500 text-lg font-bold rounded-lg text-white bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-500/30 hover:to-red-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-orange-500 disabled:bg-slate-700 disabled:border-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 uppercase tracking-widest group shadow-lg hover:shadow-orange-500/20"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-orange-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
              <span>🔮 {t("analyzingProjectButton")}</span>
            </>
          ) : (
            <>
              <span className="relative group-hover:animate-pulse">
                🎃 {t("analyzeProjectButton")}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 ml-3 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>

        {/* Character counts */}
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <span>
            Description: {submission.description.length} characters
            {submission.description.length < 50 &&
              submission.description.length > 0 && (
                <span className="text-orange-400 ml-1">(min 50)</span>
              )}
          </span>
          <span>
            Kiro Usage: {submission.kiroUsage.length} characters
            {submission.kiroUsage.length < 20 &&
              submission.kiroUsage.length > 0 && (
                <span className="text-orange-400 ml-1">(min 20)</span>
              )}
          </span>
        </div>
      </form>
    </div>
  );
};

export default ProjectSubmissionForm;
