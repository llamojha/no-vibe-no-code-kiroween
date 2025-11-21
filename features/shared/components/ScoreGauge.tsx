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
  // Clamp and normalize score (0-5, handle invalid inputs)
  const validScore =
    typeof score === "number" && !Number.isNaN(score)
      ? Math.max(0, Math.min(5, score))
      : 0;

  const percentage = (validScore / 5) * 100;

  const getColorClass = (type: "stroke" | "text"): string => {
    const prefix = type === "stroke" ? "stroke-" : "text-";

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

  // Gauge geometry (matches tests)
  const arcLength = 188.5;
  const filledLength = Math.max(
    0,
    Math.min(arcLength, (percentage / 100) * arcLength)
  );
  const formatLength = (value: number) => {
    const str = value.toFixed(2);
    return str.replace(/\.?0+$/, "");
  };
  const strokeDasharray = `${formatLength(filledLength)} ${arcLength}`;
  const arcPath = "M 30 90 A 42.42 42.42 0 1 1 90 90";

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

      <svg className="w-full h-full" viewBox="0 0 120 120">
        {/* Background circles */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        <circle
          cx="60"
          cy="60"
          r="40"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
        />

        {/* Tick marks at 0, 25, 50, 75, 100% */}
        {[0, 90, 180, 270, 360].map((angle) => {
          const rad = ((angle - 90) * Math.PI) / 180;
          const outer = {
            x: 60 + 54 * Math.cos(rad),
            y: 60 + 54 * Math.sin(rad),
          };
          const inner = {
            x: 60 + 48 * Math.cos(rad),
            y: 60 + 48 * Math.sin(rad),
          };
          return (
            <line
              key={angle}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
            />
          );
        })}

        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          strokeDasharray={`${arcLength} ${arcLength}`}
          strokeLinecap="round"
        />

        {/* Filled arc */}
        <path
          d={arcPath}
          fill="none"
          strokeWidth="6"
          strokeDasharray={strokeDasharray}
          className={getColorClass("stroke")}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease-out" }}
        />
      </svg>
    </div>
  );
};
