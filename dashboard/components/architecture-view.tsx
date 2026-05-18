"use client";

import { useEffect, useRef, useState } from "react";
import { ReportData } from "@/lib/report-schema";
import { FileCode } from "lucide-react";
import mermaid from "mermaid";
import { useT } from "@/lib/i18n";

interface ArchitectureViewProps {
  report: ReportData;
}

export function ArchitectureView({ report }: ArchitectureViewProps) {
  const { t } = useT();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidError, setMermaidError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#06b6d4",
          primaryTextColor: "#fafafa",
          primaryBorderColor: "#0891b2",
          lineColor: "#52525b",
          secondaryColor: "#18181b",
          tertiaryColor: "#09090b",
        },
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidRef.current || !isInitialized) return;

      try {
        setMermaidError(false);
        const { svg } = await mermaid.render(
          `mermaid-${Date.now()}`,
          report.architecture.mermaid
        );
        mermaidRef.current.innerHTML = svg;
      } catch (error) {
        console.error("Mermaid render error:", error);
        setMermaidError(true);
      }
    };

    renderDiagram();
  }, [report.architecture.mermaid, isInitialized]);

  const getKindBadgeColor = (kind: string) => {
    switch (kind) {
      case "main":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "api":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "cli":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Mermaid Diagram - spans 2 cols on desktop */}
      <div className="md:col-span-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-zinc-700/60 animate-fade-up">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
          {t.cardArchitecture}
        </h2>
        {mermaidError ? (
          <div className="space-y-4">
            <p className="text-amber-400 text-sm font-mono">
              Diagram too complex to render. Showing raw Mermaid code:
            </p>
            <pre className="bg-zinc-950/50 rounded-lg p-4 overflow-x-auto text-sm text-zinc-300 font-mono">
              {report.architecture.mermaid}
            </pre>
          </div>
        ) : (
          <div
            ref={mermaidRef}
            className="bg-zinc-950/50 rounded-lg p-4 overflow-x-auto flex justify-center items-center min-h-[300px]"
          />
        )}
      </div>

      {/* Summary - 1 col on desktop */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-zinc-700/60 animate-fade-up delay-100">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
          {t.cardSummary}
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed">
          {report.architecture.summary}
        </p>
      </div>

      {/* Entry Points - full width */}
      <div className="md:col-span-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-zinc-700/60 animate-fade-up delay-200">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
          {t.cardEntryPoints}
        </h2>
        {report.architecture.entryPoints.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {report.architecture.entryPoints.map((entry, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-sm font-mono text-zinc-300 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="truncate max-w-xs">{entry.path}</span>
                <span className={`ml-1 px-2 py-0.5 rounded text-xs border ${getKindBadgeColor(entry.kind)}`}>
                  {entry.kind}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 font-mono italic text-center py-4 max-w-2xl mx-auto leading-relaxed">
            {t.entryPointsEmpty}
          </p>
        )}
      </div>
    </div>
  );
}

// Made with Bob
