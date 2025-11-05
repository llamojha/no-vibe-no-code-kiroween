"use client";

import React from "react";
import { AnimationMode } from "@/features/home/hooks/useAnimationPreference";

interface AnimationToggleProps {
  currentMode: AnimationMode;
  onToggle: (mode: AnimationMode) => void;
  isLoading?: boolean;
}

const AnimationToggle: React.FC<AnimationToggleProps> = ({
  currentMode,
  onToggle,
  isLoading = false,
}) => {
  const handleToggle = () => {
    if (isLoading) return;
    const newMode: AnimationMode =
      currentMode === "normal" ? "spooky" : "normal";
    onToggle(newMode);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-accent/30 p-2 rounded-none">
      {/* Normal Mode Indicator */}
      <div
        className={`flex items-center gap-2 transition-opacity duration-300 ${
          currentMode === "normal" ? "opacity-100" : "opacity-50"
        }`}
      >
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <span className="text-xs font-medium text-white uppercase tracking-wider">
          Normal
        </span>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className={`
          relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
          ${
            currentMode === "spooky"
              ? "bg-orange-500 focus:ring-orange-500"
              : "bg-gray-600 focus:ring-blue-500"
          }
          ${
            isLoading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:scale-105"
          }
        `}
        aria-label={`Switch to ${
          currentMode === "normal" ? "spooky" : "normal"
        } animation mode`}
        aria-pressed={currentMode === "spooky"}
        role="switch"
      >
        <div
          className={`
            absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg
            transition-transform duration-300 ease-in-out
            ${currentMode === "spooky" ? "translate-x-6" : "translate-x-0.5"}
          `}
        >
          {/* Icon inside the toggle */}
          <div className="w-full h-full flex items-center justify-center">
            {currentMode === "spooky" ? (
              // Spooky icon (ghost/pumpkin)
              <svg
                className="w-3 h-3 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1s1-.45 1-1v-1h4v1c0 .55.45 1 1 1s1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
            ) : (
              // Normal icon (circle/dot)
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </div>
      </button>

      {/* Spooky Mode Indicator */}
      <div
        className={`flex items-center gap-2 transition-opacity duration-300 ${
          currentMode === "spooky" ? "opacity-100" : "opacity-50"
        }`}
      >
        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1s1-.45 1-1v-1h4v1c0 .55.45 1 1 1s1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 11c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-white uppercase tracking-wider">
          Spooky
        </span>
      </div>
    </div>
  );
};

export default AnimationToggle;
