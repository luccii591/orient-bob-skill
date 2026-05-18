"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReport } from "@/lib/report-store";
import { ReportData } from "@/lib/report-schema";
import { ArchitectureView } from "@/components/architecture-view";
import { StartHereView } from "@/components/start-here-view";
import { HotFilesView } from "@/components/hot-files-view";
import { OnboardingView } from "@/components/onboarding-view";
import { useT, type Lang } from "@/lib/i18n";

type TabType = "architecture" | "start-here" | "hot-files" | "onboarding";

function LanguageToggle() {
  const { lang, setLang, t } = useT();
  const toggle = () => setLang(lang === "es" ? "en" : "es");
  return (
    <button
      onClick={toggle}
      aria-label={t.toggleAriaLabel}
      className="inline-flex items-center gap-1 rounded-md border border-zinc-800/60 bg-zinc-900/40 px-2 py-1 font-mono text-xs text-zinc-400 transition-colors duration-200 hover:border-zinc-700/60 hover:text-zinc-200"
    >
      <span className={lang === "es" ? "text-cyan-400" : ""}>ES</span>
      <span className="text-zinc-600">/</span>
      <span className={lang === "en" ? "text-cyan-400" : ""}>EN</span>
    </button>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useT();
  const id = params.id as string;
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("architecture");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = () => {
      const data = getReport(id);
      setReport(data);
      setLoading(false);
    };

    loadReport();
  }, [id]);

  useEffect(() => {
    // Save active tab to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("orient-active-tab", activeTab);
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400 font-mono text-sm">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-200">Report not found</h1>
          <p className="text-zinc-400">The report you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Upload New Report
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "architecture", label: t.tabArchitecture },
    { id: "start-here", label: t.tabStartHere },
    { id: "hot-files", label: t.tabHotFiles },
    { id: "onboarding", label: t.tabOnboarding },
  ];

  const tabDescriptions: Record<TabType, string> = {
    architecture: t.descArchitecture,
    "start-here": t.descStartHere,
    "hot-files": t.descHotFiles,
    onboarding: t.descOnboarding,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-sm font-semibold text-zinc-100">
                {t.brandName}
              </h1>
              <span className="text-zinc-600">/</span>
              <span className="font-mono text-xs text-zinc-500">
                {report.meta.repoName}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <span className="font-mono text-xs text-zinc-400">
                {new Date(report.meta.analyzedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800/60 px-6">
        <div className="max-w-6xl mx-auto">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm transition-colors duration-200 relative
                  ${activeTab === tab.id
                    ? "text-cyan-400"
                    : "text-zinc-400 hover:text-zinc-200"
                  }
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-fade-in" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed animate-fade-in" key={activeTab}>
          {tabDescriptions[activeTab]}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === "architecture" && <ArchitectureView report={report} />}
          {activeTab === "start-here" && <StartHereView report={report} />}
          {activeTab === "hot-files" && <HotFilesView report={report} />}
          {activeTab === "onboarding" && <OnboardingView report={report} />}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
