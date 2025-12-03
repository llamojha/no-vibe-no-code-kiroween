"use client";

import React from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface InsufficientCreditsErrorProps {
  credits: number;
  onGetMoreCredits?: () => void;
}

/**
 * InsufficientCreditsError Component
 *
 * Displays a prominent error message when a user has insufficient credits
 * to perform an analysis. Shows current credit count and provides information
 * about the credit system with a call-to-action to get more credits.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
const InsufficientCreditsError: React.FC<InsufficientCreditsErrorProps> = ({
  credits,
  onGetMoreCredits,
}) => {
  const { t } = useLocale();

  const handleGetMoreCredits = () => {
    if (onGetMoreCredits) {
      onGetMoreCredits();
    } else {
      // Default behavior: could navigate to a purchase/upgrade page
      // For now, we'll just log (can be implemented later)
      console.log("Get more credits clicked");
    }
  };

  return (
    <div
      className="my-6 p-6 bg-gradient-to-br from-red-950/50 to-orange-950/50 border-2 border-red-500/70 rounded-lg"
      role="alert"
      aria-live="assertive"
      data-testid="insufficient-credits-error"
    >
      {/* Icon and Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-red-300">
          {t("insufficientCreditsTitle")}
        </h3>
      </div>

      {/* Error Message */}
      <div className="space-y-3 mb-5">
        <p className="text-red-200 text-base">
          {t("insufficientCreditsMessage").replace(
            "{credits}",
            credits.toString()
          )}
        </p>
        <p className="text-red-300/80 text-sm">
          {t("insufficientCreditsExplanation")}
        </p>
        <p className="text-red-300/60 text-xs italic">
          {t("creditsWillRefresh")}
        </p>
      </div>

      {/* Call to Action */}
      <div className="flex justify-center">
        <button
          onClick={handleGetMoreCredits}
          className="px-6 py-3 bg-red-600/30 border-2 border-red-500 text-red-200 font-semibold rounded-lg hover:bg-red-500/40 hover:border-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label={t("getMoreCredits")}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {t("getMoreCredits")}
          </span>
        </button>
      </div>
    </div>
  );
};

export default InsufficientCreditsError;
