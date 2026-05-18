import { ReportData } from "@/lib/report-schema";
import { FileCode } from "lucide-react";

interface StartHereViewProps {
  report: ReportData;
}

export function StartHereView({ report }: StartHereViewProps) {
  const sortedItems = [...report.startHere].sort((a, b) => a.order - b.order);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedItems.map((item, index) => (
        <div
          key={item.order}
          className="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-cyan-500/30 hover:bg-zinc-900/60 hover:-translate-y-0.5 animate-fade-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Order number */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/5 font-mono text-sm font-semibold text-gradient-cyan mb-4">
            {item.order}
          </div>

          {/* File path */}
          <div className="relative flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <code className="font-mono text-sm text-zinc-200 break-all">
              {item.path}
            </code>
          </div>

          {/* Why text */}
          <p className="relative text-sm text-zinc-400 leading-relaxed">
            {item.why}
          </p>
        </div>
      ))}

      {sortedItems.length === 0 && (
        <div className="col-span-full text-center py-12 text-zinc-400 font-mono text-sm">
          No recommended files found in this report.
        </div>
      )}
    </div>
  );
}

// Made with Bob
