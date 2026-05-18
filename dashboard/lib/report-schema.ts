import { z } from "zod";

// Enums for restricted fields
const primaryLanguageEnum = z.enum(["TypeScript", "JavaScript"]);
const packageManagerEnum = z.enum(["npm", "pnpm", "yarn", "bun"]);
const entryPointKindEnum = z.enum(["main", "api", "cli"]);
const severityEnum = z.enum(["low", "med", "high"]);

// Meta section schema
const metaSchema = z.object({
  repoName: z.string(),
  analyzedAt: z.string().transform((val) => new Date(val)),
  primaryLanguage: primaryLanguageEnum,
  totalFiles: z.number().int().nonnegative(),
  loc: z.number().int().nonnegative(),
  orientVersion: z.string(),
});

// Stack section schema
const stackSchema = z.object({
  runtime: z.array(z.string()),
  packageManager: packageManagerEnum,
  frameworks: z.array(z.string()),
  databases: z.array(z.string()),
  testing: z.array(z.string()),
  ciCd: z.array(z.string()),
});

// Architecture section schema
const entryPointSchema = z.object({
  path: z.string(),
  kind: entryPointKindEnum,
});

const architectureSchema = z.object({
  mermaid: z.string(),
  summary: z.string(),
  entryPoints: z.array(entryPointSchema),
});

// Start Here section schema
const startHereItemSchema = z.object({
  path: z.string(),
  why: z.string(),
  order: z.number().int().positive(),
});

// Hot Files section schema
const hotFileSchema = z.object({
  path: z.string(),
  commits: z.number().int().nonnegative(),
  uniqueAuthors: z.number().int().nonnegative(),
  score: z.number().nonnegative(),
  reason: z.string().optional(),
});

// Onboarding Checklist section schema
const onboardingChecklistSchema = z.object({
  frontend: z.array(z.string()),
  backend: z.array(z.string()),
  fullstack: z.array(z.string()),
});

// Risks section schema
const riskSchema = z.object({
  severity: severityEnum,
  description: z.string(),
  evidence: z.string(),
});

// Complete report schema
export const reportSchema = z.object({
  meta: metaSchema,
  stack: stackSchema,
  architecture: architectureSchema,
  startHere: z.array(startHereItemSchema),
  hotFiles: z.array(hotFileSchema),
  onboardingChecklist: onboardingChecklistSchema,
  risks: z.array(riskSchema),
});

// Export derived type
export type ReportData = z.infer<typeof reportSchema>;

// Helper function to validate report data
export function validateReport(data: unknown): ReportData {
  const result = reportSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    throw new Error(`Invalid report.json: ${errors}`);
  }
  
  return result.data;
}

// Made with Bob
