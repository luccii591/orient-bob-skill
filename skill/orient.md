---
name: orient
description: Analyze Node/TypeScript repos and generate onboarding artifacts
version: 0.1.0
author: Orient Team
trigger: /orient
fallback: If Bob doesn't recognize this as a native Skill, execute as Node.js script via execute_command
---

# Orient Skill

## Purpose

Converts any Node/TypeScript repository into a guided tour in under 60 seconds. Generates architecture diagrams, recommended reading paths, hot files analysis, and role-based onboarding checklists to eliminate the "where do I start?" problem when exploring unfamiliar codebases.

## When to use

Invoke `/orient` in Bob IDE when you're in a Node/TypeScript repository that you want to understand quickly. The skill will analyze the codebase structure, git history, dependencies, and generate comprehensive onboarding artifacts.

## Implementation

### Step 1: Validate Repository

**Tool**: `read_file`

```
Check if package.json exists in workspace root
IF NOT exists:
  RETURN error "Not a Node/TypeScript repository"
ELSE:
  CONTINUE to Step 2
```

### Step 2: Detect Package Manager

**Tool**: `list_files`

```
Search for lockfiles in order:
  - pnpm-lock.yaml -> packageManager = "pnpm"
  - yarn.lock -> packageManager = "yarn"
  - bun.lockb -> packageManager = "bun"
  - package-lock.json -> packageManager = "npm"
DEFAULT: packageManager = "npm"
```

### Step 3: Parse package.json

**Tool**: `read_file`

```
Read package.json content
Extract:
  - name (repo name)
  - dependencies (object)
  - devDependencies (object)
  - scripts (object)
  - main (entry point)
  - bin (CLI entry points)
Store in memory for subsequent steps
```

### Step 4: Detect Frameworks

**Tool**: None (in-memory processing)

```
Combine dependencies + devDependencies into allDeps
frameworks = []

IF "next" IN allDeps:
  frameworks.push("Next.js")
IF "express" IN allDeps OR "fastify" IN allDeps OR "koa" IN allDeps:
  frameworks.push("Express/Fastify/Koa")
IF "react" IN allDeps AND "next" NOT IN allDeps:
  frameworks.push("React SPA")
IF "@nestjs/core" IN allDeps:
  frameworks.push("NestJS")
IF "vue" IN allDeps:
  frameworks.push("Vue.js")
IF "svelte" IN allDeps:
  frameworks.push("Svelte")
```

### Step 5: Detect Testing and CI/CD

**Tool**: `list_files` + `read_file`

```
testing = []
IF "jest" IN allDeps: testing.push("Jest")
IF "vitest" IN allDeps: testing.push("Vitest")
IF "mocha" IN allDeps: testing.push("Mocha")
IF "@playwright/test" IN allDeps: testing.push("Playwright")

ciCd = []
List files in .github/workflows/
IF any .yml or .yaml files exist:
  ciCd.push("GitHub Actions")
IF .gitlab-ci.yml exists:
  ciCd.push("GitLab CI")
IF .circleci/config.yml exists:
  ciCd.push("CircleCI")
```

### Step 6: Calculate Lines of Code

**Tool**: `execute_command`

```
Command (Windows PowerShell):
  Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx | 
  Where-Object { $_.FullName -notmatch 'node_modules|dist|build|\.next' } | 
  Get-Content | Measure-Object -Line

Command (Unix/Linux):
  find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | 
  grep -v 'node_modules\|dist\|build\|\.next' | 
  xargs wc -l | tail -1

Parse output to extract total LOC
Store as meta.loc
```

### Step 7: Calculate Hot Files

**Tool**: `execute_command`

```
Command:
  git log --pretty=format: --name-only --since="1 year ago" --diff-filter=AM | 
  grep -E '\.(ts|tsx|js|jsx)$' | 
  grep -v 'node_modules\|dist\|build\|\.next\|lock' | 
  sort | uniq -c | sort -rn | head -30

Parse output:
  FOR each line "  N path/to/file.ts":
    commits = N
    path = "path/to/file.ts"
    
    Get unique authors:
      git log --follow "path" | grep "^Author:" | sort -u | wc -l
    uniqueAuthors = result
    
    Calculate score:
      score = log(commits + 1) * sqrt(uniqueAuthors)
    
    hotFiles.push({ path, commits, uniqueAuthors, score })

Sort hotFiles by score DESC
Take top 30
```

### Step 8: Generate Start Here Path

**Tool**: `read_file` + `search_files`

```
startHere = []
order = 1

1. Entry point from package.json.main or scripts.start/dev:
   IF exists: startHere.push({ path, why: "Main entry point", order++ })

2. README.md:
   IF exists AND lineCount > 100:
     startHere.push({ path: "README.md", why: "Comprehensive documentation", order++ })

3. Main config file:
   Search for: next.config.js, next.config.ts, tsconfig.json, vite.config.ts
   IF found: startHere.push({ path, why: "Core configuration", order++ })

4. Most connected file (most imports):
   Search all .ts/.tsx files for import statements
   Count incoming imports per file
   topFile = file with most imports
   startHere.push({ path: topFile, why: "Central module with most dependencies", order++ })

5. Test entry point:
   Search for: __tests__/, tests/, *.test.ts, *.spec.ts
   IF found: startHere.push({ path, why: "Test suite entry", order++ })

6. Utility/lib folder:
   IF src/lib/ OR src/utils/ exists:
     startHere.push({ path, why: "Core utilities and helpers", order++ })

7. Schema/types:
   Search for: schema.ts, types.ts, models.ts
   IF found: startHere.push({ path, why: "Type definitions and data models", order++ })

Limit to max 7 entries, min 3
```

### Step 9: Detect Entry Points

**Tool**: None (in-memory from Step 3)

```
entryPoints = []

IF package.json.main exists:
  entryPoints.push({ path: main, kind: "main" })

IF package.json.bin exists:
  FOR each binName, binPath in bin:
    entryPoints.push({ path: binPath, kind: "cli" })

IF "start" in scripts OR "dev" in scripts:
  Parse script command to extract file path
  entryPoints.push({ path, kind: "api" })
```

### Step 10: Generate Mermaid Diagram

**Tool**: `list_files`

```
List directories recursively (max depth 3)
Build graph structure:

graph TD
  Root[repo-name]
  
  IF src/ exists:
    Root --> Src[src/]
    IF src/components/ exists: Src --> Components[components/]
    IF src/lib/ exists: Src --> Lib[lib/]
    IF src/api/ exists: Src --> Api[api/]
    IF src/pages/ exists: Src --> Pages[pages/]
    IF src/app/ exists: Src --> App[app/]
  
  IF tests/ OR __tests__/ exists:
    Root --> Tests[tests/]
  
  IF public/ exists:
    Root --> Public[public/]
  
  Add config files as nodes:
    Root --> Config[config files]

Limit to max 20 nodes
Generate valid Mermaid syntax (no special chars in labels)
```

### Step 11: Generate Onboarding Checklist

**Tool**: None (in-memory based on detected stack)

```
onboardingChecklist = { frontend: [], backend: [], fullstack: [] }

IF "Next.js" in frameworks:
  frontend.push("Explore app/ directory structure (App Router)")
  frontend.push("Review page.tsx files for routing")
  frontend.push("Check components/ for reusable UI")
  fullstack.push("Understand API routes in app/api/")
  fullstack.push("Review server vs client components")

IF "React SPA" in frameworks:
  frontend.push("Find main App component")
  frontend.push("Review routing setup (React Router)")
  frontend.push("Check state management (Redux/Zustand)")

IF "Express" in frameworks:
  backend.push("Review server.js or app.js entry point")
  backend.push("Understand middleware chain")
  backend.push("Check routes/ directory structure")
  backend.push("Review database connection setup")

IF "NestJS" in frameworks:
  backend.push("Review main.ts bootstrap")
  backend.push("Understand module structure")
  backend.push("Check controllers and services")
  backend.push("Review dependency injection patterns")

IF testing frameworks detected:
  fullstack.push("Run test suite: npm test")
  fullstack.push("Review test coverage")

Add generic items:
  fullstack.push("Install dependencies: npm install")
  fullstack.push("Review environment variables (.env.example)")
  fullstack.push("Check package.json scripts")
```

### Step 12: Detect Risks

**Tool**: `list_files` + in-memory analysis

```
risks = []

IF no lockfile exists:
  risks.push({
    severity: "high",
    description: "No lockfile found",
    evidence: "Missing package-lock.json/yarn.lock/pnpm-lock.yaml"
  })

IF dependencies count > 50:
  risks.push({
    severity: "med",
    description: "Large dependency tree",
    evidence: `${depCount} dependencies may increase maintenance burden`
  })

IF no testing framework detected:
  risks.push({
    severity: "med",
    description: "No testing framework detected",
    evidence: "No Jest, Vitest, or Mocha in dependencies"
  })

IF no CI/CD detected:
  risks.push({
    severity: "low",
    description: "No CI/CD pipeline detected",
    evidence: "No .github/workflows/ or similar"
  })

IF TypeScript not in devDeps:
  risks.push({
    severity: "low",
    description: "JavaScript-only project",
    evidence: "Consider migrating to TypeScript for better type safety"
  })
```

### Step 13: Write .orient/report.json

**Tool**: `write_to_file`

```
Create .orient/ directory if not exists
Assemble complete report object:
{
  meta: {
    repoName: from package.json.name,
    analyzedAt: new Date().toISOString(),
    primaryLanguage: "TypeScript" OR "JavaScript",
    totalFiles: count from Step 6,
    loc: from Step 6,
    orientVersion: "0.1.0"
  },
  stack: { runtime, packageManager, frameworks, databases, testing, ciCd },
  architecture: { mermaid, summary, entryPoints },
  startHere: from Step 8,
  hotFiles: from Step 7,
  onboardingChecklist: from Step 11,
  risks: from Step 12
}

Write to .orient/report.json
```

### Step 14: Write .orient/architecture.mmd

**Tool**: `write_to_file`

```
Extract mermaid diagram from report.architecture.mermaid
Write to .orient/architecture.mmd as standalone file
```

### Step 15: Update AGENTS.md

**Tool**: `read_file` + `apply_diff` OR `write_to_file`

```
IF AGENTS.md exists:
  Read content
  Search for markers: <!-- ORIENT:START --> and <!-- ORIENT:END -->
  
  IF markers exist:
    Replace content between markers with new Orient block
  ELSE:
    Find first H1 heading
    Insert Orient block after H1
ELSE:
  Create new AGENTS.md with full template

Orient block content:
<!-- ORIENT:START -->
---
> Generated by Orient on [ISO-8601 date]
> Full report: .orient/report.json

## Detected Stack
- Runtime: node@X.X
- Package manager: [npm|pnpm|yarn|bun]
- Frameworks: [list]
- Testing: [list]
- CI/CD: [list]

## Quick Start (auto-generated)
[First 3-5 items from startHere with path and why]

---
<!-- ORIENT:END -->
```

## Output

Generates three files in the target repository:

1. **`.orient/report.json`** - Complete structured analysis (consumed by dashboard)
2. **`.orient/architecture.mmd`** - Standalone Mermaid diagram
3. **`AGENTS.md`** - Enriched with Orient block (preserves existing content)

## AGENTS.md enrichment template

```markdown
<!-- ORIENT:START -->
---
> Generated by Orient on 2026-05-03T21:30:00.000Z
> Full report: .orient/report.json

## Detected Stack
- Runtime: node@20.x
- Package manager: pnpm
- Frameworks: Next.js, React
- Testing: Jest, Vitest
- CI/CD: GitHub Actions

## Quick Start (auto-generated)
1. `package.json` - Project configuration and dependencies
2. `src/app/page.tsx` - Main application entry point
3. `src/lib/utils.ts` - Core utility functions
4. `prisma/schema.prisma` - Database schema definitions
5. `src/components/ui/` - Reusable UI components

---
<!-- ORIENT:END -->
```

## Fallback (if Bob doesn't recognize Skill format)

If Bob doesn't recognize this markdown file as a native Skill, execute the standalone Node.js script:

```bash
node skill/orient.js <repo-path>
```

The script `skill/orient.js` implements the same algorithm using only Node.js built-in modules (fs, path, child_process).

## Limitations

- Maximum 500 files analyzed (prioritizes src/, lib/, app/, pages/, api/)
- Requires git history for hot files analysis (gracefully degrades if unavailable)
- Only supports Node/TypeScript repositories (Python/Java/Go planned for future versions)
- Hot files analysis limited to last 1 year of commits
- Mermaid diagrams limited to 20 nodes for rendering performance