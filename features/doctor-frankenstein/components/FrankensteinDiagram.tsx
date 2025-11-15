"use client";

import React from "react";
import { useLocale } from "@/features/locale/context/LocaleContext";

interface ElementWithDescription {
  name: string;
  description?: string;
  url?: string;
}

interface FrankensteinDiagramProps {
  elements: ElementWithDescription[];
  ideaTitle: string;
}

export const FrankensteinDiagram: React.FC<FrankensteinDiagramProps> = ({
  elements,
  ideaTitle,
}) => {
  const { t } = useLocale();
  return (
    <div className="relative w-full mb-8 p-8 bg-gradient-to-br from-purple-900/30 to-black/50 rounded-lg border-2 border-orange-500/50 overflow-hidden">
      {/* Background lightning effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-orange-500 via-transparent to-transparent animate-pulse" />
        <div
          className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-orange-500 via-transparent to-transparent animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="relative z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-sm font-bold text-orange-400 mb-2 uppercase tracking-wider">
            ⚡ Frankenstein Combination ⚡
          </h3>
        </div>

        {/* Elements Grid */}
        <div
          className={`grid gap-4 mb-8 ${
            elements.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-2 md:grid-cols-4"
          }`}
        >
          {elements.map((element, index) => {
            // Determine tooltip position based on index
            // First element: align left, Last element: align right, Middle: center
            const totalElements = elements.length;
            const isFirst = index === 0;
            const isLast = index === totalElements - 1;
            const isSecondToLast = index === totalElements - 2;

            let tooltipPositionClass = "left-1/2 -translate-x-1/2"; // Center by default
            if (isFirst) {
              tooltipPositionClass = "left-0"; // Align left
            } else if (isLast) {
              tooltipPositionClass = "right-0"; // Align right
            } else if (isSecondToLast && totalElements === 4) {
              tooltipPositionClass = "right-0"; // Align right for second to last in 4-element grid
            }

            return (
              <div
                key={index}
                className="relative group"
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                {/* Connection line to center */}
                <svg
                  className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none"
                  style={{
                    transform: "translate(-50%, -50%)",
                    zIndex: 0,
                  }}
                >
                  <line
                    x1="50%"
                    y1="50%"
                    x2="50%"
                    y2="100%"
                    stroke="url(#lightning-gradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.3}s` }}
                  />
                  <defs>
                    <linearGradient
                      id="lightning-gradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Element card */}
                <div className="relative bg-gradient-to-br from-purple-800/80 to-purple-900/80 border-2 border-orange-500/50 rounded-lg p-4 hover:border-orange-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50 cursor-help">
                  {/* Bolt icon */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs animate-pulse">
                    ⚡
                  </div>

                  {/* Element number */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold border border-orange-500">
                    {index + 1}
                  </div>

                  {/* Element name */}
                  <p className="text-sm font-bold text-orange-300 text-center mt-2 line-clamp-3">
                    {element.name}
                  </p>

                  {/* Info indicator */}
                  {element.description && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-purple-700/90 rounded-full flex items-center justify-center text-[8px] border border-orange-500/40 group-hover:bg-orange-500 group-hover:border-orange-400 transition-all">
                      <span className="opacity-80 group-hover:opacity-100">
                        ℹ
                      </span>
                    </div>
                  )}

                  {/* Tooltip */}
                  {element.description && (
                    <div
                      className={`absolute bottom-full ${tooltipPositionClass} mb-2 w-56 max-w-[85vw] md:w-64 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50`}
                    >
                      <div className="bg-gray-900 text-white text-[11px] rounded-md p-2.5 shadow-2xl border border-orange-500/60">
                        {/* Arrow - positioned based on tooltip alignment */}
                        <div
                          className={`absolute top-full ${
                            isFirst
                              ? "left-6"
                              : isLast || isSecondToLast
                              ? "right-6"
                              : "left-1/2 -translate-x-1/2"
                          } -mt-[1px]`}
                        >
                          <div className="border-[6px] border-transparent border-t-orange-500/60" />
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-[5px] border-transparent border-t-gray-900" />
                        </div>

                        {/* Content */}
                        <div className="relative">
                          <p className="font-semibold text-orange-400 text-xs mb-1 line-clamp-1">
                            {element.name}
                          </p>
                          <p className="text-gray-300 leading-snug line-clamp-3">
                            {element.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center fusion point */}
        <div className="relative flex justify-center">
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-orange-500/30 rounded-full animate-ping" />
            <div className="absolute w-24 h-24 border-2 border-orange-500/50 rounded-full animate-pulse" />
          </div>

          {/* Result card */}
          <div className="relative bg-gradient-to-br from-orange-600 to-red-600 rounded-lg p-6 border-4 border-orange-400 shadow-2xl shadow-orange-500/50 max-w-md animate-bounce-slow">
            <div className="text-center">
              <div className="text-3xl mb-2">🧟</div>
              <p className="text-xs font-bold text-orange-100 uppercase tracking-wider mb-2">
                {t("createdMonster") || "Created Monster"}
              </p>
              <p className="text-lg font-bold text-white line-clamp-2">
                {ideaTitle}
              </p>
            </div>

            {/* Sparks */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"
              style={{ animationDelay: "1.5s" }}
            />
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-purple-400">
            <span className="animate-pulse">⚡</span>
            <span>{t("fusionComplete") || "Fusion Complete"}</span>
            <span className="animate-pulse">⚡</span>
          </div>
        </div>
      </div>

      {/* Add custom animation */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
