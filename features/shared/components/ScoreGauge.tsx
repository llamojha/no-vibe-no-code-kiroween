import React from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  showValue?: boolean;
  className?: string;
  colorOverrides?: {
    excellent?: string;
    good?: string;
    fair?: string;
    poor?: string;
  };
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 160,
  showValue = true,
  className = "",
  colorOverrides = {},
}) => {
  // Validate and normalize score (clamp to 0-5, handle NaN/undefined)
  const validScore =
    typeof score === "number" && !isNaN(score)
      ? Math.max(0, Math.min(5, score))
      : 0;

  // Calculate fill percentage: (validScore / 5) * 100
  const percentage = (validScore / 5) * 100;

  // Determine color based on thresholds
  const getColorClass = (type: "stroke" | "text"): string => {
    const prefix = type === "stroke" ? "stroke-" : "text-";

    // ≥4.0 green, ≥3.5 yellow, ≥2.5 orange, <2.5 red
    if (validScore >= 4.0) {
      return `${prefix}${colorOverrides.excellent || "green-400"}`;
    }
    if (validScore >= 3.5) {
      return `${prefix}${colorOverrides.good || "yellow-400"}`;
    }
    if (validScore >= 2.5) {
      return `${prefix}${colorOverrides.fair || "orange-400"}`;
    }
    return `${prefix}${colorOverrides.poor || "red-400"}`;
  };

  // Full circle gauge: circumference = 2 * π * r = 2 * π * 32 ≈ 201.06
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${
    (percentage / 100) * circumference
  } ${circumference}`;
  // No offset needed - rotation handles starting position

  // Calculate font size based on gauge size
  const fontSize = size / 4;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showValue && (
        <div
          data-testid="score-value"
          className={`absolute font-bold font-mono ${getColorClass("text")}`}
          style={{
            fontSize: `${fontSize}px`,
            textShadow: "0 0 10px currentColor",
          }}
        >
          {validScore === 0 ? "—" : validScore.toFixed(1)}
        </div>
      )}

      <svg className="w-full h-full" viewBox="0 0 80 80">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />

        {/* Progress circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeDasharray={strokeDasharray}
          className={getColorClass("stroke")}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 1s ease-out",
            transform: "rotate(-90deg)",
            transformOrigin: "40px 40px",
          }}
        />
      </svg>
    </div>
  );
};
