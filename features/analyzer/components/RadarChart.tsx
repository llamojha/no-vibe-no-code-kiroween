'use client';

import React, { useState } from 'react';
import type { ScoreCriterion } from '@/lib/types';
import { useLocale } from '@/features/locale/context/LocaleContext';

interface RadarChartProps {
  data: ScoreCriterion[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
    const { t } = useLocale();
    const [hoveredCriterion, setHoveredCriterion] = useState<ScoreCriterion | null>(null);

    // Handle case when data is undefined or null
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400 font-mono">
                No data available for radar chart
            </div>
        );
    }

    const size = 400;
    const center = size / 2;
    const levels = 5;
    const radius = size * 0.3; // Reduced to give labels more space

    // This fixed order is crucial for the radar chart's consistency
    const criterionOrder: Record<string, number> = {
        "Market Demand": 0,
        "Market Size": 1,
        "Uniqueness": 2,
        "Scalability": 3,
        "Potential Profitability": 4,
    };
    
    const sortedData = [...data].sort((a, b) => (criterionOrder[a.name] ?? 99) - (criterionOrder[b.name] ?? 99));

    const criterionToLocaleKey: Record<string, string> = {
        "Market Demand": "rubricCriterionMarketDemand",
        "Market Size": "rubricCriterionMarketSize",
        "Uniqueness": "rubricCriterionUniqueness",
        "Scalability": "rubricCriterionScalability",
        "Potential Profitability": "rubricCriterionPotentialProfitability",
    };

    const points: { x: number; y: number }[] = [];
    const labels: { x: number; y: number; text: string }[] = [];

    const angleSlice = (Math.PI * 2) / sortedData.length;

    sortedData.forEach((item, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const scoreRadius = (item.score / levels) * radius;
        points.push({
            x: center + scoreRadius * Math.cos(angle),
            y: center + scoreRadius * Math.sin(angle),
        });

        const labelRadius = radius * 1.4; // Increased to move labels further out
        labels.push({
            x: center + labelRadius * Math.cos(angle),
            y: center + labelRadius * Math.sin(angle),
            text: t(criterionToLocaleKey[item.name] || item.name),
        });
    });

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    const renderGrid = () => {
        // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
        const grid: React.ReactElement[] = [];
        // Concentric polygons
        for (let i = 1; i <= levels; i++) {
            const levelRadius = (i / levels) * radius;
            let levelPoints = '';
            for (let j = 0; j < sortedData.length; j++) {
                const angle = angleSlice * j - Math.PI / 2;
                const x = center + levelRadius * Math.cos(angle);
                const y = center + levelRadius * Math.sin(angle);
                levelPoints += `${x},${y} `;
            }
            grid.push(<polygon key={`level-${i}`} points={levelPoints} fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />);
        }
        // Radial lines
        for (let i = 0; i < sortedData.length; i++) {
            const angle = angleSlice * i - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            grid.push(<line key={`radial-${i}`} x1={center} y1={center} x2={x} y2={y} stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />);
        }
        return grid;
    };
    
    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g>{renderGrid()}</g>
                <polygon points={pointsString} fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="2" />
                {labels.map((label, i) => {
                    const words = label.text.split(' ');
                    const fontSize = 11; // Slightly reduced font size
                    const lineHeight = fontSize * 1.2; // Corresponds to 1.2em
                    // Calculate the starting Y to vertically center the whole text block
                    const yStart = label.y - ((words.length - 1) * lineHeight) / 2;

                    return (
                        <text
                            key={`label-${i}`}
                            x={label.x}
                            y={yStart}
                            textAnchor={Math.abs(label.x - center) < 10 ? "middle" : label.x > center ? "start" : "end"}
                            dominantBaseline="hanging"
                            fill="#a0aec0"
                            fontSize={fontSize}
                            className="font-mono uppercase tracking-wider"
                        >
                            {words.map((word, index) => (
                                <tspan
                                    key={index}
                                    x={label.x}
                                    dy={index === 0 ? 0 : `${lineHeight}px`}
                                >
                                    {word}
                                </tspan>
                            ))}
                        </text>
                    );
                })}
                <g>
                {points.map((p, i) => (
                    <g key={`point-group-${i}`} onMouseEnter={() => setHoveredCriterion(sortedData[i])} onMouseLeave={() => setHoveredCriterion(null)} className="cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
                        <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={hoveredCriterion === sortedData[i] ? 6 : 4} 
                            fill="#f000ff" 
                            className="transition-all duration-200"
                            stroke={hoveredCriterion === sortedData[i] ? '#fff' : 'none'}
                            strokeWidth="2"
                        />
                    </g>
                ))}
                </g>
            </svg>
            {hoveredCriterion && (
                <div className="absolute -bottom-4 translate-y-full w-full max-w-xs bg-primary/90 backdrop-blur-sm p-3 border border-secondary text-center rounded-none shadow-lg z-10 font-mono animate-fade-in" style={{ animationDuration: '150ms' }}>
                    <p className="font-bold text-secondary text-sm">{t(criterionToLocaleKey[hoveredCriterion.name] || hoveredCriterion.name)}: <span className="text-white">{hoveredCriterion.score.toFixed(1)}/5.0</span></p>
                    <p className="text-slate-400 text-xs mt-1">{hoveredCriterion.justification}</p>
                </div>
            )}
        </div>
    );
};

export default RadarChart;
