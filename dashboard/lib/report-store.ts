import { ReportData, validateReport } from "./report-schema";

const STORAGE_PREFIX = "orient-report-";

export function saveReport(report: ReportData): string {
  if (typeof window === "undefined") {
    throw new Error("saveReport can only be called in browser environment");
  }
  
  const uuid = crypto.randomUUID();
  const key = `${STORAGE_PREFIX}${uuid}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(report));
    return uuid;
  } catch (error) {
    throw new Error(`Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getReport(id: string): ReportData | null {
  if (typeof window === "undefined") {
    return null;
  }
  
  const key = `${STORAGE_PREFIX}${id}`;
  
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return null;
    }
    
    const parsed = JSON.parse(data);
    return validateReport(parsed);
  } catch (error) {
    console.error(`Failed to get report ${id}:`, error);
    return null;
  }
}

export function listReports(): { id: string; repoName: string; analyzedAt: string }[] {
  if (typeof window === "undefined") {
    return [];
  }
  
  const reports: { id: string; repoName: string; analyzedAt: string }[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const id = key.replace(STORAGE_PREFIX, "");
        const data = localStorage.getItem(key);
        
        if (data) {
          const parsed = JSON.parse(data);
          reports.push({
            id,
            repoName: parsed.meta?.repoName || "Unknown",
            analyzedAt: parsed.meta?.analyzedAt || new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed to list reports:", error);
  }
  
  return reports;
}

export function deleteReport(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  
  const key = `${STORAGE_PREFIX}${id}`;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to delete report ${id}:`, error);
  }
}

// Made with Bob
