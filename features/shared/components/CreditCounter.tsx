import React from "react";
import { UserTier } from "@/lib/types";

export interface CreditCounterProps {
  credits: number;
  tier: UserTier;
}

/**
 * CreditCounter component displays the user's remaining credits
 * Shows warning styling when credits are low (<=1)
 * Shows "out of credits" message when credits reach 0
 * Displays infinity symbol for admin users
 */
export const CreditCounter: React.FC<CreditCounterProps> = ({
  credits,
  tier,
}) => {
  // Admin users have unlimited credits
  const isAdmin = tier === "admin";
  const showWarning = !isAdmin && credits <= 1 && credits > 0;
  const isOutOfCredits = !isAdmin && credits === 0;

  // Determine styling based on credit status
  const containerClasses = `
    credit-counter
    flex items-center gap-3 px-4 py-3 rounded-lg
    border-2 transition-all duration-300
    ${
      isOutOfCredits
        ? "border-red-500 bg-red-500/10"
        : showWarning
        ? "border-yellow-500 bg-yellow-500/10"
        : "border-purple-500/30 bg-purple-500/5"
    }
  `.trim();

  const iconClasses = `
    credit-icon text-2xl
    ${
      isOutOfCredits
        ? "text-red-400"
        : showWarning
        ? "text-yellow-400"
        : "text-purple-400"
    }
  `.trim();

  const amountClasses = `
    credit-amount text-2xl font-bold font-mono
    ${
      isOutOfCredits
        ? "text-red-400"
        : showWarning
        ? "text-yellow-400"
        : "text-purple-400"
    }
  `.trim();

  const labelClasses = `
    credit-label text-sm
    ${
      isOutOfCredits
        ? "text-red-300"
        : showWarning
        ? "text-yellow-300"
        : "text-purple-300"
    }
  `.trim();

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3 flex-1">
        <span className={iconClasses}>⚡</span>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={amountClasses} data-testid="credit-amount">
              {isAdmin ? "∞" : credits}
            </span>
            <span className={labelClasses}>
              {isAdmin ? "unlimited credits" : "credits remaining"}
            </span>
          </div>
          {showWarning && (
            <div
              className="credit-warning text-xs text-yellow-400 mt-1"
              data-testid="credit-warning"
            >
              You're running low on credits!
            </div>
          )}
        </div>
      </div>

      {isOutOfCredits && (
        <div
          className="credit-empty flex flex-col items-end gap-2"
          data-testid="credit-empty"
        >
          <p className="text-sm text-red-300 font-medium">
            You're out of credits
          </p>
          <button
            onClick={() => {
              // TODO: Navigate to purchase page when implemented
              console.log("Navigate to purchase credits");
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors duration-200"
          >
            Get More Credits
          </button>
        </div>
      )}
    </div>
  );
};
