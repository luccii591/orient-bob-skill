"use client";

import { useState, useMemo } from "react";
import { ReportData } from "@/lib/report-schema";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";

interface OnboardingViewProps {
  report: ReportData;
}

type RoleTab = "frontend" | "backend" | "fullstack";

export function OnboardingView({ report }: OnboardingViewProps) {
  const { t } = useT();
  const defaultTab = useMemo(() => {
    const { frameworks } = report.stack;
    const hasFrontend = frameworks.some((f) =>
      ["Next.js", "React", "Vue", "Angular"].includes(f)
    );
    const hasBackend = frameworks.some((f) =>
      ["Express", "Fastify", "NestJS", "Koa"].includes(f)
    );

    if (hasFrontend && hasBackend) return "fullstack";
    if (hasBackend) return "backend";
    return "frontend";
  }, [report.stack]);

  const [activeTab, setActiveTab] = useState<RoleTab>(defaultTab);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const currentItems = report.onboardingChecklist[activeTab];

  const toggleItem = (index: number) => {
    const key = `${activeTab}-${index}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const completedCount = currentItems.filter((_, index) => {
    const key = `${activeTab}-${index}`;
    return checkedItems[key];
  }).length;

  const progressPercentage = currentItems.length > 0
    ? (completedCount / currentItems.length) * 100
    : 0;

  const tabs: { id: RoleTab; label: string }[] = [
    { id: "frontend", label: t.subTabFrontend },
    { id: "backend", label: t.subTabBackend },
    { id: "fullstack", label: t.subTabFullstack },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Sub-tabs */}
      <div className="inline-flex rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${activeTab === tab.id
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-zinc-500">
            {t.progressLabel(completedCount, currentItems.length)}
          </span>
        </div>
        <div className="h-1 bg-zinc-800/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-[width] duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div key={activeTab} className="space-y-3 animate-fade-in">
        {currentItems.map((item, index) => {
          const key = `${activeTab}-${index}`;
          const isChecked = checkedItems[key] || false;

          return (
            <label
              key={index}
              className="flex items-start gap-3 py-3 border-b border-zinc-800/40 last:border-0 cursor-pointer group"
            >
              {/* Custom checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleItem(index)}
                className="sr-only"
              />
              <span
                className={`
                  flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200 flex-shrink-0 mt-0.5
                  ${isChecked
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-600"
                  }
                `}
              >
                {isChecked && (
                  <Check className="h-3 w-3 text-cyan-400 animate-scale-in" />
                )}
              </span>

              {/* Item text */}
              <span
                className={`
                  text-sm leading-relaxed transition-all
                  ${isChecked
                    ? "line-through text-zinc-500"
                    : "text-zinc-300"
                  }
                `}
              >
                {item}
              </span>
            </label>
          );
        })}
      </div>

      {currentItems.length === 0 && (
        <div className="text-center py-12 text-zinc-400 font-mono text-sm">
          No onboarding steps available for this role.
        </div>
      )}
    </div>
  );
}

// Made with Bob
