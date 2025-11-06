"use client";

import React from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface SpookyLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const SpookyLoader: React.FC<SpookyLoaderProps> = ({
  message,
  size = "md",
}) => {
  const { t } = useLocale();
  const defaultMessage = message || t("brewingSpookyAnalysis");
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated Ghost */}
      <div className="relative mb-6">
        <div className={`${sizeClasses[size]} animate-ghost-hover`}>
          <svg
            className="w-full h-full text-orange-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.686 2 6 4.686 6 8v8c0 1.105.895 2 2 2h1l1-2h4l1 2h1c1.105 0 2-.895 2-2V8c0-3.314-2.686-6-6-6zM9 9c0-.552.448-1 1-1s1 .448 1 1-.448 1-1 1-1-.448-1-1zm4 0c0-.552.448-1 1-1s1 .448 1 1-.448 1-1 1-1-.448-1-1z" />
          </svg>
        </div>

        {/* Floating particles */}
        <div
          className="absolute -top-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-spooky-float opacity-60"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-green-400 rounded-full animate-spooky-float opacity-60"
          style={{ animationDelay: "0.5s" }}
        />
        <div
          className="absolute -bottom-2 left-1 w-1 h-1 bg-orange-400 rounded-full animate-spooky-float opacity-60"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Loading message */}
      <div
        className={`${textSizeClasses[size]} text-orange-300 font-semibold text-center animate-pulse`}
      >
        {defaultMessage}
      </div>

      {/* Spooky progress dots */}
      <div className="flex space-x-2 mt-4">
        <div
          className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
};

export default SpookyLoader;
