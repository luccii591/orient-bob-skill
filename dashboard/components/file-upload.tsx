"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { validateReport } from "@/lib/report-schema";
import { saveReport } from "@/lib/report-store";
import { useT } from "@/lib/i18n";

type UploadState = "idle" | "dragging" | "processing" | "error" | "success";

export function FileUpload() {
  const router = useRouter();
  const { t } = useT();
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".json")) {
      setState("error");
      setErrorMessage("Please upload a .json file");
      return;
    }

    setState("processing");
    setErrorMessage("");

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validatedReport = validateReport(data);
      const uuid = saveReport(validatedReport);
      
      setState("success");
      setTimeout(() => {
        router.push(`/report/${uuid}`);
      }, 500);
    } catch (error) {
      setState("error");
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to process file");
      }
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState("idle");

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState("idle");
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    if (state === "processing" || state === "success") return;
    document.getElementById("file-input")?.click();
  }, [state]);

  const getContainerClasses = () => {
    const base = "relative rounded-2xl border bg-zinc-900/40 backdrop-blur-sm p-12 transition-all duration-300";
    
    switch (state) {
      case "dragging":
        return `${base} border-cyan-500/40 bg-cyan-500/[0.03] glow-cyan cursor-pointer`;
      case "error":
        return `${base} border-red-500/40 bg-red-500/[0.03] cursor-pointer`;
      case "success":
        return `${base} border-emerald-500/40 bg-emerald-500/[0.03] cursor-wait`;
      case "processing":
        return `${base} border-zinc-800/60 cursor-wait`;
      default:
        return `${base} border-zinc-800/60 hover:border-zinc-700/60 cursor-pointer`;
    }
  };

  const getIcon = () => {
    const iconSize = 32;
    switch (state) {
      case "processing":
        return <Loader2 size={iconSize} className="text-cyan-400 animate-spin" />;
      case "error":
        return <AlertCircle size={iconSize} className="text-red-400" />;
      case "success":
        return <CheckCircle2 size={iconSize} className="text-emerald-400" />;
      case "dragging":
        return <Upload size={iconSize} className="text-cyan-400" />;
      default:
        return <Upload size={iconSize} className="text-zinc-500" />;
    }
  };

  const getMessage = () => {
    switch (state) {
      case "dragging":
        return t.dropZoneActive;
      case "processing":
        return "Validando reporte...";
      case "error":
        return errorMessage || "Error al procesar archivo";
      case "success":
        return "¡Éxito! Redirigiendo...";
      default:
        return t.dropZoneTitle;
    }
  };

  return (
    <div className="w-full">
      <input
        id="file-input"
        type="file"
        accept=".json"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={getContainerClasses()}
      >
        {/* Gradient glow background (only visible on drag-active) */}
        {state === "dragging" && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-radial from-cyan-500/10 to-transparent opacity-0 animate-fade-in pointer-events-none" />
        )}

        <div className="relative flex flex-col items-center gap-4 text-center">
          {getIcon()}
          <p className="text-base font-medium text-zinc-200">
            {getMessage()}
          </p>
          {state === "idle" && (
            <p className="text-sm text-zinc-500 font-mono mt-2">
              {t.dropZoneSubtitle}
            </p>
          )}
          {state === "error" && errorMessage && (
            <p className="text-sm text-red-400 font-mono mt-2 max-w-md">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
