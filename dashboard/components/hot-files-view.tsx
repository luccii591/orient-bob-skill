"use client";

import { useState, useMemo, useEffect } from "react";
import { ReportData } from "@/lib/report-schema";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n";

interface HotFilesViewProps {
  report: ReportData;
}

type SortColumn = "path" | "commits" | "authors" | "score";
type SortDirection = "asc" | "desc";

function useCountUp(target: number, durationMs = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function ScoreCell({ score, maxScore }: { score: number; maxScore: number }) {
  const animatedScore = useCountUp(score);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const ratio = score / maxScore;
    const widthPercent = ratio * 100;
    const timer = setTimeout(() => setBarWidth(widthPercent), 50);
    return () => clearTimeout(timer);
  }, [score, maxScore]);

  const getBarColor = () => {
    const ratio = score / maxScore;
    if (ratio >= 0.7) return "bg-gradient-to-r from-red-500 to-red-400";
    if (ratio >= 0.4) return "bg-gradient-to-r from-amber-500 to-amber-400";
    return "bg-gradient-to-r from-emerald-500 to-emerald-400";
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <div className="w-[120px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-[width] duration-700 ease-out`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-zinc-200 font-mono w-12 text-right">
        {animatedScore.toFixed(2)}
      </span>
    </div>
  );
}

export function HotFilesView({ report }: HotFilesViewProps) {
  const { t } = useT();
  const [sortColumn, setSortColumn] = useState<SortColumn>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedFiles = useMemo(() => {
    const files = [...report.hotFiles];
    
    files.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case "path":
          aVal = a.path;
          bVal = b.path;
          break;
        case "commits":
          aVal = a.commits;
          bVal = b.commits;
          break;
        case "authors":
          aVal = a.uniqueAuthors;
          bVal = b.uniqueAuthors;
          break;
        case "score":
          aVal = a.score;
          bVal = b.score;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return files;
  }, [report.hotFiles, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const maxScore = Math.max(...sortedFiles.map((f) => f.score), 1);

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-900/60 border-b border-zinc-800/60">
            <tr>
              <th
                onClick={() => handleSort("path")}
                className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {t.colPath}
                  <SortIcon column="path" />
                </div>
              </th>
              <th
                onClick={() => handleSort("commits")}
                className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors"
              >
                <div className="flex items-center justify-end gap-2">
                  {t.colCommits}
                  <SortIcon column="commits" />
                </div>
              </th>
              <th
                onClick={() => handleSort("authors")}
                className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors"
              >
                <div className="flex items-center justify-end gap-2">
                  {t.colAuthors}
                  <SortIcon column="authors" />
                </div>
              </th>
              <th
                onClick={() => handleSort("score")}
                className="px-4 py-3 text-right text-xs font-mono uppercase tracking-wider text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors"
              >
                <div className="flex items-center justify-end gap-2">
                  {t.colScore}
                  <SortIcon column="score" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file, index) => (
              <tr
                key={index}
                className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/20 transition-colors duration-200"
              >
                <td className="px-4 py-3">
                  <code className="font-mono text-sm text-zinc-300 block truncate max-w-md">
                    {file.path}
                  </code>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-zinc-200">
                  {file.commits}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-zinc-200">
                  {file.uniqueAuthors}
                </td>
                <td className="px-4 py-3 text-right">
                  <ScoreCell score={file.score} maxScore={maxScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedFiles.length === 0 && (
        <div className="text-center py-12 text-zinc-400 font-mono text-sm">
          No hot files data available.
        </div>
      )}
    </div>
  );
}

// Made with Bob
