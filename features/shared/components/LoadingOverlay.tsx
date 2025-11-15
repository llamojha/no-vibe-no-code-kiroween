"use client";

import React from "react";

interface LoadingOverlayProps {
  message: string;
}

/**
 * Consistent loading overlay with Dr. Frankenstein animation
 * Used across all analyzers for a unified loading experience
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center p-8">
        {/* Dr. Frankenstein Animation */}
        <div className="relative mb-6 animate-ghost-hover" aria-hidden="true">
          <div className="w-24 h-24">
            <svg
              className="w-full h-full animate-color-shift"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Frankenstein head */}
              <path d="M12 2C8.686 2 6 4.686 6 8v8c0 1.105.895 2 2 2h1l1-2h4l1 2h1c1.105 0 2-.895 2-2V8c0-3.314-2.686-6-6-6zM9 9c0-.552.448-1 1-1s1 .448 1 1-.448 1-1 1-1-.448-1-1zm4 0c0-.552.448-1 1-1s1 .448 1 1-.448 1-1 1-1-.448-1-1z" />
            </svg>
          </div>

          {/* Electric sparks */}
          <div
            className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full animate-spooky-float opacity-80"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-spooky-float opacity-80"
            style={{ animationDelay: "0.3s" }}
          />
          <div
            className="absolute -bottom-2 left-1 w-1 h-1 bg-green-400 rounded-full animate-spooky-float opacity-80"
            style={{ animationDelay: "0.6s" }}
          />
          <div
            className="absolute top-1/2 -right-4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-spooky-float opacity-80"
            style={{ animationDelay: "0.9s" }}
          />
        </div>

        {/* Loading message */}
        <div className="text-xl text-green-300 font-bold text-center animate-pulse mb-4">
          {message}
        </div>

        {/* Progress dots */}
        <div className="flex space-x-2" aria-hidden="true">
          <div
            className="w-3 h-3 bg-green-400 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        <span className="sr-only">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
