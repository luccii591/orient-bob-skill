"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "es" | "en";

type Dictionary = {
  // Landing
  eyebrow: string;
  heroSubtitle: string;
  dropZoneTitle: string;
  dropZoneSubtitle: string;
  dropZoneActive: string;
  // Header
  brandName: string;
  // Tabs
  tabArchitecture: string;
  tabStartHere: string;
  tabHotFiles: string;
  tabOnboarding: string;
  // Tab descriptions
  descArchitecture: string;
  descStartHere: string;
  descHotFiles: string;
  descOnboarding: string;
  // Architecture view
  cardArchitecture: string;
  cardSummary: string;
  cardEntryPoints: string;
  entryPointsEmpty: string;
  // Hot Files view
  colPath: string;
  colCommits: string;
  colAuthors: string;
  colScore: string;
  // Onboarding view
  subTabFrontend: string;
  subTabBackend: string;
  subTabFullstack: string;
  progressLabel: (checked: number, total: number) => string;
  // Toggle
  toggleAriaLabel: string;
};

const dictionary: Record<Lang, Dictionary> = {
  es: {
    eyebrow: "BOB SKILL · /orient",
    heroSubtitle: "Convierte cualquier repo Node/TypeScript en un tour guiado de onboarding en menos de 60 segundos",
    dropZoneTitle: "Drag & drop o haz clic para seleccionar",
    dropZoneSubtitle: "report.json · max 5 MB",
    dropZoneActive: "Suelta el archivo",
    brandName: "Orient",
    tabArchitecture: "Architecture",
    tabStartHere: "Start Here",
    tabHotFiles: "Hot Files",
    tabOnboarding: "Onboarding",
    descArchitecture: "Estructura de carpetas, stack detectado y archivos de entrada del proyecto.",
    descStartHere: "Los archivos clave que un desarrollador nuevo debe leer primero, en orden de importancia.",
    descHotFiles: "Archivos modificados con más frecuencia. El score combina cantidad de commits y número de autores.",
    descOnboarding: "Checklist accionable según tu rol. Cambia entre Frontend, Backend o Fullstack para ver tareas relevantes.",
    cardArchitecture: "ARCHITECTURE",
    cardSummary: "SUMMARY",
    cardEntryPoints: "ENTRY POINTS",
    entryPointsEmpty: "Sin entry points npm declarados. Este proyecto no expone los campos main ni bin en package.json (común en apps Electron, CLIs con entry custom, o frameworks con routing por convención).",
    colPath: "PATH",
    colCommits: "COMMITS",
    colAuthors: "AUTHORS",
    colScore: "SCORE",
    subTabFrontend: "Frontend",
    subTabBackend: "Backend",
    subTabFullstack: "Fullstack",
    progressLabel: (checked, total) => `${checked}/${total} completado`,
    toggleAriaLabel: "Cambiar idioma",
  },
  en: {
    eyebrow: "BOB SKILL · /orient",
    heroSubtitle: "Turn any Node/TypeScript repo into a guided onboarding tour in under 60 seconds",
    dropZoneTitle: "Drag & drop or click to select",
    dropZoneSubtitle: "report.json · max 5 MB",
    dropZoneActive: "Drop the file",
    brandName: "Orient",
    tabArchitecture: "Architecture",
    tabStartHere: "Start Here",
    tabHotFiles: "Hot Files",
    tabOnboarding: "Onboarding",
    descArchitecture: "Folder structure, detected stack, and project entry points.",
    descStartHere: "The key files a new developer should read first, ordered by importance.",
    descHotFiles: "Most frequently modified files. Score combines commit count and number of authors.",
    descOnboarding: "Actionable checklist by role. Switch between Frontend, Backend, or Fullstack to see relevant tasks.",
    cardArchitecture: "ARCHITECTURE",
    cardSummary: "SUMMARY",
    cardEntryPoints: "ENTRY POINTS",
    entryPointsEmpty: "No npm entry points declared. This project doesn't expose main or bin fields in package.json (common for Electron apps, CLIs with custom entry, or frameworks with convention-based routing).",
    colPath: "PATH",
    colCommits: "COMMITS",
    colAuthors: "AUTHORS",
    colScore: "SCORE",
    subTabFrontend: "Frontend",
    subTabBackend: "Backend",
    subTabFullstack: "Fullstack",
    progressLabel: (checked, total) => `${checked}/${total} completed`,
    toggleAriaLabel: "Switch language",
  },
};

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "orient-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dictionary[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx;
}

// Made with Bob
