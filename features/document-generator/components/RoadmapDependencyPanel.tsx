"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { useLocale } from "@/features/locale/context/LocaleContext";

export interface RoadmapDependencyPanelProps {
  content: string;
  onSave: (updatedContent: string) => Promise<void>;
  isSaving?: boolean;
}

/**
 * Extract dependency section, mermaid graph, and critical path lines from markdown.
 */
function parseDependencySection(content: string) {
  const sectionRegex = /## 3\. Dependencies[\s\S]*?(?=## \d+\.\s|$)/i;
  const sectionMatch = content.match(sectionRegex);
  const section = sectionMatch ? sectionMatch[0] : "";

  const mermaidRegex = /```mermaid\s*([\s\S]*?)```/i;
  const mermaidMatch = section.match(mermaidRegex);
  const graph = mermaidMatch ? mermaidMatch[1].trim() : "";

  const criticalPathRegex = /###\s*Critical Path[\s\S]*?(?=###\s|##\s|$)/i;
  const criticalPathMatch = section.match(criticalPathRegex);
  const criticalPathBlock = criticalPathMatch ? criticalPathMatch[0] : "";
  const criticalLines = criticalPathBlock
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-+/, "").trim());

  return { section, graph, criticalLines };
}

function buildDependencySection(
  graph: string,
  criticalLines: string[]
): string {
  const criticalPathContent =
    criticalLines.length > 0
      ? criticalLines.map((line) => `- ${line.trim()}`).join("\n")
      : "- Define the critical path items here";

  return `## 3. Dependencies & Blockers

\`\`\`mermaid
${graph.trim()}
\`\`\`

### Critical Path
${criticalPathContent}
`;
}

function replaceDependencySection(
  fullContent: string,
  newSection: string
): string {
  const sectionRegex = /## 3\. Dependencies[\s\S]*?(?=## \d+\.\s|$)/i;
  if (sectionRegex.test(fullContent)) {
    return fullContent.replace(sectionRegex, newSection);
  }
  return `${fullContent.trim()}\n\n${newSection}`;
}

export const RoadmapDependencyPanel: React.FC<RoadmapDependencyPanelProps> = ({
  content,
  onSave,
  isSaving = false,
}) => {
  const { t } = useLocale();
  const { graph: initialGraph, criticalLines: initialCriticalLines } =
    useMemo(() => parseDependencySection(content), [content]);

  const [graphText, setGraphText] = useState(
    initialGraph ||
      `graph LR
    A[User Auth] --> B[Core Feature]
    B --> C[Analytics]
    B --> D[Premium]
    C --> E[Scale]`
  );
  const [criticalPath, setCriticalPath] = useState(
    (initialCriticalLines && initialCriticalLines.join("\n")) ||
      "Core Feature -> Analytics -> Scale"
  );
  const [renderError, setRenderError] = useState<string | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  // Render Mermaid graph
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "dark" });
    const render = async () => {
      if (!graphRef.current) return;
      try {
        const { svg } = await mermaid.render(
          `roadmap-graph-${Date.now()}`,
          graphText
        );
        graphRef.current.innerHTML = svg;
        setRenderError(null);
      } catch (error) {
        console.error("Mermaid render error", error);
        setRenderError(
          (error as Error).message || "Failed to render dependency graph"
        );
        graphRef.current.innerHTML = "";
      }
    };
    render();
  }, [graphText]);

  const handleSave = useCallback(async () => {
    const newSection = buildDependencySection(
      graphText,
      criticalPath.split("\n").filter((line) => line.trim())
    );
    const updatedContent = replaceDependencySection(content, newSection);
    await onSave(updatedContent);
  }, [content, criticalPath, graphText, onSave]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-accent uppercase tracking-wider">
            {t("roadmapDependenciesTitle") || "Dependencies & Critical Path"}
          </h3>
          <p className="text-sm text-slate-400">
            {t("roadmapDependenciesSubtitle") ||
              "Edit the graph and critical path below, then regenerate this section only."}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            isSaving
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90"
          }`}
        >
          {isSaving
            ? t("saving") || "Saving..."
            : t("regenerateSection") || "Regenerate Section"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">
            {t("mermaidGraphLabel") || "Mermaid Graph"}
          </label>
          <textarea
            className="w-full h-48 bg-slate-950/70 border border-slate-800 rounded-md p-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            value={graphText}
            onChange={(e) => setGraphText(e.target.value)}
            aria-label="Mermaid dependency graph"
          />
          <p className="text-xs text-slate-500">
            {t("mermaidHelper") ||
              "Edit nodes/edges (e.g., A-->B). Graph updates on change."}
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-300">
            {t("graphPreviewLabel") || "Graph Preview"}
          </label>
          <div className="mt-2 min-h-[200px] rounded-md border border-slate-800 bg-slate-950/50 p-3">
            {renderError ? (
              <p className="text-sm text-red-400">{renderError}</p>
            ) : (
              <div ref={graphRef} />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          {t("criticalPathLabel") || "Critical Path (one item per line)"}
        </label>
        <textarea
          className="w-full h-32 bg-slate-950/70 border border-slate-800 rounded-md p-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          value={criticalPath}
          onChange={(e) => setCriticalPath(e.target.value)}
          aria-label="Critical path lines"
        />
        <p className="text-xs text-slate-500">
          {t("criticalPathHelper") ||
            "List the blocking steps in order. Each line becomes a bullet."}
        </p>
      </div>
    </div>
  );
};

export default RoadmapDependencyPanel;
