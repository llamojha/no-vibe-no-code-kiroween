"use client";

import React from "react";

interface UserIdentityBadgeProps {
  userEmail?: string;
  userName?: string;
  className?: string;
}

/**
 * UserIdentityBadge component displays the current user's identity
 * Shows "Logged in as [user identifier]" with a visual indicator
 *
 * @param userEmail - User's email address
 * @param userName - User's display name (preferred over email)
 * @param className - Additional CSS classes for positioning and styling
 */
export const UserIdentityBadge: React.FC<UserIdentityBadgeProps> = ({
  userEmail,
  userName,
  className = "",
}) => {
  const displayName = userEmail || userName  || "User";

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-accent/30
                     rounded-lg text-sm ${className}`}
      role="status"
      aria-label={`Logged in as ${displayName}`}
    >
      <div
        className="w-2 h-2 rounded-full bg-green-400 animate-pulse"
        aria-hidden="true"
      />
      <span className="text-slate-400">Logged in as</span>
      <span className="text-accent font-semibold">{displayName}</span>
    </div>
  );
};
