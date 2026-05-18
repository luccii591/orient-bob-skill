"use client";

import { FileUpload } from "@/components/file-upload";
import { useT } from "@/lib/i18n";

export default function Home() {
  const { t } = useT();
  
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-xs font-mono text-cyan-400 animate-fade-up">
            {t.eyebrow}
          </div>

          {/* Hero */}
          <div className="space-y-6 animate-fade-up delay-100">
            <h1 className="text-6xl md:text-7xl font-semibold tracking-tight">
              <span className="text-gradient-cyan">Orient</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mt-6 max-w-xl mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          {/* File Upload */}
          <div className="w-full mt-12 animate-fade-up delay-300">
            <FileUpload />
          </div>
        </div>
      </div>
    </main>
  );
}

// Made with Bob
