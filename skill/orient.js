#!/usr/bin/env node

/**
 * Orient - Standalone Node.js implementation
 * Fallback script if Bob doesn't recognize skill/orient.md as native Skill
 * Usage: node skill/orient.js <repo-path>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ORIENT_VERSION = '0.1.0';

function main() {
  const repoPath = process.argv[2] || process.cwd();
  
  if (!fs.existsSync(path.join(repoPath, 'package.json'))) {
    console.error('Error: Not a Node/TypeScript repository (package.json not found)');
    process.exit(1);
  }

  console.log(`Analyzing repository: ${repoPath}`);
  
  const report = analyzeRepository(repoPath);
  
  const orientDir = path.join(repoPath, '.orient');
  if (!fs.existsSync(orientDir)) {
    fs.mkdirSync(orientDir, { recursive: true });
  }
  
  // Write report.json
  fs.writeFileSync(
    path.join(orientDir, 'report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('✓ Generated .orient/report.json');
  
  // Write architecture.mmd
  fs.writeFileSync(
    path.join(orientDir, 'architecture.mmd'),
    report.architecture.mermaid
  );
  console.log('✓ Generated .orient/architecture.mmd');
  
  // Update AGENTS.md
  enrichAgentsMd(repoPath, report);
  console.log('✓ Updated AGENTS.md');
  
  console.log('\nAnalysis complete! Open .orient/report.json in the Orient dashboard.');
}

function analyzeRepository(repoPath) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8')
  );
  
  const packageManager = detectPackageManager(repoPath);
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const frameworks = detectFrameworks(allDeps);
  const testing = detectTesting(allDeps);
  const ciCd = detectCiCd(repoPath);
  const loc = calculateLoc(repoPath);
  const totalFiles = countFiles(repoPath);
  const hotFiles = calculateHotFiles(repoPath);
  const startHere = generateStartHere(repoPath, packageJson, hotFiles);
  const entryPoints = detectEntryPoints(packageJson);
  const mermaid = generateMermaid(repoPath, packageJson.name);
  const onboardingChecklist = generateOnboardingChecklist(frameworks, testing);
  const risks = detectRisks(repoPath, allDeps, testing, ciCd);
  
  const primaryLanguage = allDeps.typescript ? 'TypeScript' : 'JavaScript';
  
  return {
    meta: {
      repoName: packageJson.name || path.basename(repoPath),
      analyzedAt: new Date().toISOString(),
      primaryLanguage,
      totalFiles,
      loc,
      orientVersion: ORIENT_VERSION
    },
    stack: {
      runtime: [`node@${process.version.slice(1)}`],
      packageManager,
      frameworks,
      databases: [],
      testing,
      ciCd
    },
    architecture: {
      mermaid,
      summary: `${primaryLanguage} project with ${frameworks.join(', ')}`,
      entryPoints
    },
    startHere,
    hotFiles,
    onboardingChecklist,
    risks
  };
}

function detectPackageManager(repoPath) {
  if (fs.existsSync(path.join(repoPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(repoPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(repoPath, 'bun.lockb'))) return 'bun';
  return 'npm';
}

function detectFrameworks(deps) {
  const frameworks = [];
  // Desktop / runtime hosts (chequear primero porque afectan el etiquetado de la UI)
  const isElectron = !!deps.electron;
  const isTauri = !!deps['@tauri-apps/api'];
  if (isElectron) frameworks.push('Electron');
  if (isTauri) frameworks.push('Tauri');

  // Meta-frameworks Node SSR/SSG
  if (deps.next) frameworks.push('Next.js');
  if (deps.nuxt) frameworks.push('Nuxt');
  if (deps['@remix-run/react'] || deps.remix) frameworks.push('Remix');
  if (deps.astro) frameworks.push('Astro');

  // Backends
  if (deps.express || deps.fastify || deps.koa || deps.hono) frameworks.push('Express/Fastify/Koa/Hono');
  if (deps['@nestjs/core']) frameworks.push('NestJS');

  // UI libraries (solo etiquetar React SPA si no es Next, ni Remix, ni Electron, ni Tauri)
  const hasMetaReact = deps.next || deps['@remix-run/react'] || deps.remix;
  const hasHostReact = isElectron || isTauri;
  if (deps.react && !hasMetaReact && !hasHostReact) frameworks.push('React SPA');
  if (deps.react && hasHostReact) frameworks.push('React (renderer)');

  if (deps.vue && !deps.nuxt) frameworks.push('Vue.js');
  if (deps.svelte && !deps['@sveltejs/kit']) frameworks.push('Svelte');
  if (deps['@sveltejs/kit']) frameworks.push('SvelteKit');
  if (deps['solid-js']) frameworks.push('Solid');

  // Build tools (solo si no hay meta-framework que ya implique uno)
  if (deps.vite && !deps.next && !deps.nuxt && !deps.astro && !deps['@sveltejs/kit']) {
    frameworks.push('Vite');
  }

  return frameworks;
}

function detectTesting(deps) {
  const testing = [];
  if (deps.jest) testing.push('Jest');
  if (deps.vitest) testing.push('Vitest');
  if (deps.mocha) testing.push('Mocha');
  if (deps.ava) testing.push('AVA');
  if (deps.tap || deps['node-tap']) testing.push('Tap');
  if (deps['@playwright/test'] || deps.playwright) testing.push('Playwright');
  if (deps.cypress) testing.push('Cypress');
  if (deps['@testing-library/react']) testing.push('React Testing Library');
  return testing;
}

function detectCiCd(repoPath) {
  const ciCd = [];
  const workflowsPath = path.join(repoPath, '.github', 'workflows');
  if (fs.existsSync(workflowsPath)) {
    const files = fs.readdirSync(workflowsPath);
    if (files.some(f => f.endsWith('.yml') || f.endsWith('.yaml'))) {
      ciCd.push('GitHub Actions');
    }
  }
  if (fs.existsSync(path.join(repoPath, '.gitlab-ci.yml'))) {
    ciCd.push('GitLab CI');
  }
  if (fs.existsSync(path.join(repoPath, '.circleci', 'config.yml'))) {
    ciCd.push('CircleCI');
  }
  return ciCd;
}

function calculateLoc(repoPath) {
  try {
    const isWindows = process.platform === 'win32';
    let output;
    
    if (isWindows) {
      // PowerShell command for Windows
      const cmd = `powershell -Command "Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object { $_.FullName -notmatch 'node_modules|dist|build|\\.next' } | Get-Content | Measure-Object -Line | Select-Object -ExpandProperty Lines"`;
      output = execSync(cmd, { cwd: repoPath, encoding: 'utf8' });
    } else {
      // Unix command
      const cmd = `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v 'node_modules\\|dist\\|build\\|\\.next' | xargs wc -l | tail -1`;
      output = execSync(cmd, { cwd: repoPath, encoding: 'utf8' });
    }
    
    const match = output.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  } catch (error) {
    return 0;
  }
}

function countFiles(repoPath) {
  let count = 0;
  function walk(dir) {
    if (count > 500) return; // Limit
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === 'build' || file === '.next') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walk(filePath);
        } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
          count++;
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }
  walk(repoPath);
  return count;
}

function calculateHotFiles(repoPath) {
  try {
    const cmd = `git log --pretty=format: --name-only -n 2000`;
    const output = execSync(cmd, { cwd: repoPath, encoding: 'utf8' });
    
    const fileCounts = {};
    output.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (!/\.(ts|tsx|js|jsx)$/.test(trimmed)) return;
      if (/node_modules|dist|build|\.next|lock/.test(trimmed)) return;
      fileCounts[trimmed] = (fileCounts[trimmed] || 0) + 1;
    });
    
    const hotFiles = Object.entries(fileCounts)
      .map(([filePath, commits]) => {
        let uniqueAuthors = 1;
        try {
          // Use git's --pretty=format:%ae to get only author emails, one per line.
          // No shell pipes — works on Windows, macOS, Linux.
          const authorOutput = execSync(
            `git log --follow --pretty=format:%ae "${filePath}"`,
            { cwd: repoPath, encoding: 'utf8' }
          );
          const authors = new Set(
            authorOutput.split('\n').map(s => s.trim()).filter(Boolean)
          );
          uniqueAuthors = authors.size || 1;
        } catch (error) {
          // Default to 1 author if git command fails (e.g., file outside repo).
        }
        
        const score = Math.log(commits + 1) * Math.sqrt(uniqueAuthors);
        return { path: filePath, commits, uniqueAuthors, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    
    return hotFiles;
  } catch (error) {
    return [];
  }
}

function generateStartHere(repoPath, packageJson, hotFiles) {
  const startHere = [];
  let order = 1;
  
  // 1. Entry point
  if (packageJson.main) {
    startHere.push({
      path: packageJson.main,
      why: 'Main entry point',
      order: order++
    });
  }
  
  // 2. README
  const readmePath = path.join(repoPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const lines = fs.readFileSync(readmePath, 'utf8').split('\n').length;
    if (lines > 100) {
      startHere.push({
        path: 'README.md',
        why: 'Comprehensive documentation',
        order: order++
      });
    }
  }
  
  // 3. Config files
  const configs = ['next.config.js', 'next.config.ts', 'tsconfig.json', 'vite.config.ts'];
  for (const config of configs) {
    if (fs.existsSync(path.join(repoPath, config))) {
      startHere.push({
        path: config,
        why: 'Core configuration',
        order: order++
      });
      break;
    }
  }
  
  // 4. Most connected file (use hottest file as proxy)
  if (hotFiles.length > 0) {
    startHere.push({
      path: hotFiles[0].path,
      why: 'Most actively maintained file',
      order: order++
    });
  }
  
  // 5. Tests
  const testDirs = ['__tests__', 'tests', 'test'];
  for (const dir of testDirs) {
    if (fs.existsSync(path.join(repoPath, dir))) {
      startHere.push({
        path: `${dir}/`,
        why: 'Test suite entry',
        order: order++
      });
      break;
    }
  }
  
  // 6. Lib/utils
  const utilDirs = ['src/lib', 'src/utils', 'lib', 'utils'];
  for (const dir of utilDirs) {
    if (fs.existsSync(path.join(repoPath, dir))) {
      startHere.push({
        path: `${dir}/`,
        why: 'Core utilities and helpers',
        order: order++
      });
      break;
    }
  }
  
  // 7. Schema/types
  const schemaFiles = ['schema.ts', 'types.ts', 'src/types.ts', 'src/schema.ts'];
  for (const file of schemaFiles) {
    if (fs.existsSync(path.join(repoPath, file))) {
      startHere.push({
        path: file,
        why: 'Type definitions and data models',
        order: order++
      });
      break;
    }
  }
  
  return startHere.slice(0, 7);
}

function detectEntryPoints(packageJson) {
  const entryPoints = [];
  
  if (packageJson.main) {
    entryPoints.push({ path: packageJson.main, kind: 'main' });
  }
  
  if (packageJson.bin) {
    if (typeof packageJson.bin === 'string') {
      entryPoints.push({ path: packageJson.bin, kind: 'cli' });
    } else {
      Object.values(packageJson.bin).forEach(binPath => {
        entryPoints.push({ path: binPath, kind: 'cli' });
      });
    }
  }
  
  return entryPoints;
}

function generateMermaid(repoPath, repoName) {
  const nodes = [`Root["${repoName}"]`];
  const edges = [];

  // Directorios a ignorar siempre (hidden, build artifacts, vendor)
  const ignoreDirs = new Set([
    'node_modules', 'dist', 'build', '.next', '.git', '.cache',
    'coverage', '.turbo', '.vercel', '.idea', '.vscode', '.DS_Store',
    'out', '.output', '.nuxt', '.svelte-kit', '.parcel-cache'
  ]);

  // Sub-directorios que vale la pena expandir si están bajo un dir relevante
  const expandableSubDirs = new Set([
    'components', 'lib', 'api', 'utils', 'hooks', 'pages', 'app',
    'services', 'controllers', 'models', 'routes', 'middleware',
    'reducers', 'store', 'features', 'modules'
  ]);

  let topLevelDirs = [];
  try {
    topLevelDirs = fs.readdirSync(repoPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => !name.startsWith('.') && !ignoreDirs.has(name))
      .sort();
  } catch (error) {
    // Si falla la lectura, fallback al comportamiento mínimo
    topLevelDirs = [];
  }

  // Limitar a 10 directorios top-level para que el diagrama no sea ilegible
  const MAX_TOP_DIRS = 10;
  const visibleDirs = topLevelDirs.slice(0, MAX_TOP_DIRS);

  visibleDirs.forEach((dir, idx) => {
    const nodeId = `D${idx}`;
    nodes.push(`${nodeId}["${dir}/"]`);
    edges.push(`Root --> ${nodeId}`);

    // Expandir sub-directorios solo si el dir es relevante
    try {
      const subEntries = fs.readdirSync(path.join(repoPath, dir), { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .filter(name => !name.startsWith('.') && !ignoreDirs.has(name) && expandableSubDirs.has(name))
        .sort()
        .slice(0, 5); // máximo 5 sub-dirs por dir padre

      subEntries.forEach((subDir, subIdx) => {
        const subNodeId = `${nodeId}_${subIdx}`;
        nodes.push(`${subNodeId}["${subDir}/"]`);
        edges.push(`${nodeId} --> ${subNodeId}`);
      });
    } catch (error) {
      // Sub-dir read failed, skip silently
    }
  });

  nodes.push('Config["config files"]');
  edges.push('Root --> Config');

  return `graph TD\n  ${nodes.join('\n  ')}\n  ${edges.join('\n  ')}`;
}

function generateOnboardingChecklist(frameworks, testing) {
  const checklist = {
    frontend: [],
    backend: [],
    fullstack: ['Install dependencies: npm install', 'Review environment variables (.env.example)', 'Check package.json scripts']
  };

  // === FRONTEND ===
  if (frameworks.includes('Next.js')) {
    checklist.frontend.push('Explore app/ directory structure (App Router)');
    checklist.frontend.push('Review page.tsx files for routing');
    checklist.frontend.push('Check components/ for reusable UI');
    checklist.fullstack.push('Understand API routes in app/api/');
    checklist.fullstack.push('Review server vs client components');
  }

  if (frameworks.includes('React SPA')) {
    checklist.frontend.push('Find main App component');
    checklist.frontend.push('Review routing setup (React Router or similar)');
    checklist.frontend.push('Check state management (Redux/Zustand/Context)');
  }

  if (frameworks.includes('React (renderer)')) {
    checklist.frontend.push('Locate the renderer entry (typically lib/index.tsx or app/index.tsx)');
    checklist.frontend.push('Identify the root React component and its state shape');
    checklist.frontend.push('Map IPC channels used from renderer (ipcRenderer.send/invoke)');
    checklist.frontend.push('Review styling approach (CSS modules, styled-components, Tailwind)');
  }

  if (frameworks.includes('Nuxt')) {
    checklist.frontend.push('Explore pages/ directory and file-based routing');
    checklist.frontend.push('Review nuxt.config.ts for modules and middleware');
    checklist.frontend.push('Understand server/ vs client/ rendering');
  }

  if (frameworks.includes('Remix')) {
    checklist.frontend.push('Explore app/routes/ structure');
    checklist.frontend.push('Review loaders and actions per route');
    checklist.frontend.push('Understand nested layouts');
  }

  if (frameworks.includes('Astro')) {
    checklist.frontend.push('Explore src/pages/ directory');
    checklist.frontend.push('Identify which components are islands (client:*)');
    checklist.frontend.push('Review content/ collections if present');
  }

  if (frameworks.includes('Vue.js')) {
    checklist.frontend.push('Find main Vue app instance');
    checklist.frontend.push('Review router/index.ts for routing');
    checklist.frontend.push('Check state management (Pinia/Vuex)');
  }

  if (frameworks.includes('Svelte') || frameworks.includes('SvelteKit')) {
    checklist.frontend.push('Explore routes/ structure (file-based)');
    checklist.frontend.push('Review +page.svelte and +layout.svelte conventions');
    checklist.frontend.push('Check stores/ for shared state');
  }

  if (frameworks.includes('Solid')) {
    checklist.frontend.push('Find App.tsx and root render call');
    checklist.frontend.push('Review signals and reactive primitives usage');
  }

  // === BACKEND ===
  if (frameworks.includes('Express/Fastify/Koa/Hono')) {
    checklist.backend.push('Review server.js / app.js / index.js entry point');
    checklist.backend.push('Understand middleware chain');
    checklist.backend.push('Check routes/ or controllers/ directory');
    checklist.backend.push('Review database connection setup');
  }

  if (frameworks.includes('NestJS')) {
    checklist.backend.push('Review main.ts bootstrap');
    checklist.backend.push('Understand module structure');
    checklist.backend.push('Check controllers and services');
    checklist.backend.push('Review dependency injection patterns');
  }

  if (frameworks.includes('Electron')) {
    checklist.backend.push('Locate the main process entry (typically app/index.ts or main.ts)');
    checklist.backend.push('Review BrowserWindow creation and lifecycle');
    checklist.backend.push('Map IPC channels exposed via ipcMain.on/handle');
    checklist.backend.push('Identify preload script(s) and contextBridge usage');
    checklist.backend.push('Review electron-builder / electron-forge config');
  }

  if (frameworks.includes('Tauri')) {
    checklist.backend.push('Review src-tauri/src/main.rs entry point');
    checklist.backend.push('Identify Tauri commands exposed via #[tauri::command]');
    checklist.backend.push('Review tauri.conf.json for app configuration');
  }

  // === FULLSTACK additions based on testing ===
  if (testing.length > 0) {
    checklist.fullstack.push('Run test suite: npm test');
    checklist.fullstack.push('Review test coverage and CI integration');
  }

  return checklist;
}

function detectRisks(repoPath, deps, testing, ciCd) {
  const risks = [];
  
  const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
  const hasLockfile = lockfiles.some(f => fs.existsSync(path.join(repoPath, f)));
  
  if (!hasLockfile) {
    risks.push({
      severity: 'high',
      description: 'No lockfile found',
      evidence: 'Missing package-lock.json/yarn.lock/pnpm-lock.yaml'
    });
  }
  
  const depCount = Object.keys(deps).length;
  if (depCount > 50) {
    risks.push({
      severity: 'med',
      description: 'Large dependency tree',
      evidence: `${depCount} dependencies may increase maintenance burden`
    });
  }
  
  if (testing.length === 0) {
    risks.push({
      severity: 'med',
      description: 'No testing framework detected',
      evidence: 'No Jest, Vitest, or Mocha in dependencies'
    });
  }
  
  if (ciCd.length === 0) {
    risks.push({
      severity: 'low',
      description: 'No CI/CD pipeline detected',
      evidence: 'No .github/workflows/ or similar'
    });
  }
  
  if (!deps.typescript) {
    risks.push({
      severity: 'low',
      description: 'JavaScript-only project',
      evidence: 'Consider migrating to TypeScript for better type safety'
    });
  }
  
  return risks;
}

function enrichAgentsMd(repoPath, report) {
  const agentsMdPath = path.join(repoPath, 'AGENTS.md');
  const orientBlock = generateOrientBlock(report);
  
  if (fs.existsSync(agentsMdPath)) {
    let content = fs.readFileSync(agentsMdPath, 'utf8');
    
    const startMarker = '<!-- ORIENT:START -->';
    const endMarker = '<!-- ORIENT:END -->';
    
    if (content.includes(startMarker) && content.includes(endMarker)) {
      // Replace existing block
      const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
      content = content.replace(regex, orientBlock);
    } else {
      // Insert after first H1
      const h1Match = content.match(/^#\s+.+$/m);
      if (h1Match) {
        const insertPos = h1Match.index + h1Match[0].length;
        content = content.slice(0, insertPos) + '\n\n' + orientBlock + content.slice(insertPos);
      } else {
        // Prepend if no H1
        content = orientBlock + '\n\n' + content;
      }
    }
    
    fs.writeFileSync(agentsMdPath, content);
  } else {
    // Create new AGENTS.md
    const template = `# ${report.meta.repoName}\n\n${orientBlock}\n\n## Project Documentation\n\nAdd your project documentation here.\n`;
    fs.writeFileSync(agentsMdPath, template);
  }
}

function generateOrientBlock(report) {
  const startHereList = report.startHere.slice(0, 5).map(item => 
    `${item.order}. \`${item.path}\` - ${item.why}`
  ).join('\n');
  
  return `<!-- ORIENT:START -->
---
> Generated by Orient on ${report.meta.analyzedAt}
> Full report: .orient/report.json

## Detected Stack
- Runtime: ${report.stack.runtime.join(', ')}
- Package manager: ${report.stack.packageManager}
- Frameworks: ${report.stack.frameworks.join(', ') || 'None'}
- Testing: ${report.stack.testing.join(', ') || 'None'}
- CI/CD: ${report.stack.ciCd.join(', ') || 'None'}

## Quick Start (auto-generated)
${startHereList}

---
<!-- ORIENT:END -->`;
}

if (require.main === module) {
  main();
}

module.exports = { analyzeRepository };

// Made with Bob
