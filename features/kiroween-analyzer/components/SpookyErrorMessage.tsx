"use client";

import React from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface SpookyErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const SpookyErrorMessage: React.FC<SpookyErrorMessageProps> = ({
  message,
  onRetry,
}) => {
  const { t } = useLocale();
  return (
    <div
      className="bg-gradient-to-br from-red-950/50 to-orange-950/50 border-2 border-red-500/50 rounded-lg p-6 text-center"
      role="alert"
      aria-atomic="true"
    >
      <div className="text-red-400 mb-4" aria-hidden="true">
        <svg
          className="w-12 h-12 mx-auto animate-pulse"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-red-300 mb-2">
        <span aria-hidden="true">👻 </span>
        {t("somethingSpookyHappened")}
      </h3>
      <p className="text-red-200 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          🔄 {t("tryAgain")}
        </button>
      )}
    </div>
  );
};

export default SpookyErrorMessage;
