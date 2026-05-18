# Orient MVP - Executable 22-Hour Plan
**Version**: 1.0 (Final)  
**Created**: 2026-05-03  
**Budget**: 40 Bobcoins (0.26 spent, 39.74 remaining)

## 1. Lista priorizada de archivos a crear

```
skill/orient.md                          - Bob Skill con logica de analisis completa
examples/sample-output.json              - Fixture realista para desarrollo del dashboard
dashboard/package.json                   - Dependencias Next.js 15 + Tailwind v4 + shadcn
dashboard/tsconfig.json                  - TypeScript strict mode config
dashboard/tailwind.config.ts             - Tailwind v4 config
dashboard/next.config.ts                 - Next.js 15 App Router config
dashboard/app/layout.tsx                 - Root layout con metadata
dashboard/app/page.tsx                   - Landing page con drag-and-drop
dashboard/app/report/[id]/page.tsx       - Vista principal del reporte
dashboard/components/file-upload.tsx     - Drag-and-drop component (client)
dashboard/components/architecture-view.tsx - Renderiza Mermaid + summary
dashboard/components/start-here-view.tsx - Lista ordenada de archivos recomendados
dashboard/components/hot-files-view.tsx  - Tabla sorteable de hot files
dashboard/components/onboarding-view.tsx - Checklist interactivo por rol
dashboard/lib/report-schema.ts           - Zod schema para validacion
dashboard/lib/report-store.ts            - Client-side state management
docs/video-script.md                     - Script del demo de 3 minutos
docs/budget-tracking.md                  - Tracking de Bobcoins gastados
```

## 2. Diseño detallado del skill skill/orient.md

### Herramientas Bob utilizadas
- `list_files` - Escanear estructura del repo recursivamente
- `read_file` - Leer package.json, lockfiles, configs, entry points
- `execute_command` - Ejecutar git log para hot files analysis
- `write_to_file` - Generar .orient/report.json
- `apply_diff` - Insertar bloque Orient en AGENTS.md existente
- `search_files` - Buscar imports para detectar archivo mas conectado

### Secuencia del algoritmo (numerado)

1. **Validar repo Node/TS**: Verificar existencia de `package.json`, rechazar si no existe
2. **Detectar package manager**: Buscar lockfiles en orden (pnpm-lock.yaml, yarn.lock, bun.lockb, package-lock.json)
3. **Parsear package.json**: Extraer name, dependencies, devDependencies, scripts, main, bin
4. **Detectar frameworks**: Aplicar reglas de deteccion (next, express, react, nestjs, etc.)
5. **Detectar testing/CI**: Buscar jest/vitest en deps, .github/workflows/*.yml
6. **Calcular LOC**: `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l` (excluir node_modules)
7. **Ejecutar git log**: Comando hot files, parsear output, calcular scores
8. **Generar start-here path**: Aplicar heuristica de 7 pasos, ordenar por prioridad
9. **Detectar entry points**: Desde package.json.main, .bin, scripts.start/dev
10. **Generar Mermaid**: Crear grafo basado en estructura de directorios (src/, lib/, api/, components/)
11. **Generar onboarding checklist**: Basado en frameworks detectados (frontend/backend/fullstack)
12. **Detectar risks**: Heuristicas (no package-lock, muchos deps, no tests, etc.)
13. **Escribir .orient/report.json**: JSON completo segun schema
14. **Escribir .orient/architecture.mmd**: Diagrama Mermaid standalone
15. **Actualizar AGENTS.md**: Insertar bloque entre marcadores `<!-- ORIENT:START -->` y `<!-- ORIENT:END -->`

### Deteccion de stack Node/TS

```javascript
// Pseudocodigo del skill
packageManager = 
  exists("pnpm-lock.yaml") ? "pnpm" :
  exists("yarn.lock") ? "yarn" :
  exists("bun.lockb") ? "bun" : "npm"

frameworks = []
deps = packageJson.dependencies + packageJson.devDependencies
if ("next" in deps) frameworks.push("Next.js")
if ("express" in deps || "fastify" in deps) frameworks.push("Express/Fastify")
if ("react" in deps && "next" not in deps) frameworks.push("React SPA")
if ("@nestjs/core" in deps) frameworks.push("NestJS")
```

### Calculo de hot files con git log

```bash
# Comando ejecutado por el skill
git log --pretty=format: --name-only --since="1 year ago" --diff-filter=AM | 
  grep -E '\.(ts|tsx|js|jsx)$' | 
  grep -v 'node_modules\|dist\|build\|\.next\|lock' |
  sort | uniq -c | sort -rn | head -30

# Parseo del output
# "  42 src/app.ts" -> commits=42, path="src/app.ts"
# Luego: git log --follow "src/app.ts" | grep "^Author:" | sort -u | wc -l -> uniqueAuthors
# score = log(commits + 1) * sqrt(uniqueAuthors)
```

### Generacion de Mermaid desde filesystem

```javascript
// Heuristica simple basada en directorios (max 20 nodos)
graph TD
  Root[repo-name]
  Root --> src[src/]
  src --> components[components/]
  src --> lib[lib/]
  src --> api[api/]
  Root --> tests[tests/]
  Root --> config[config files]
```

### Manejo de repos grandes

- Limite: inspeccionar max 500 archivos .ts/.tsx/.js/.jsx
- Si excede, priorizar: src/, lib/, app/, pages/, api/
- Hot files: siempre top 30 por git log
- Start-here: max 7 archivos, no mas

### Estructura del archivo orient.md como Bob Skill

```markdown
---
name: orient
description: Analyze Node/TypeScript repos and generate onboarding artifacts
version: 0.1.0
author: Orient Team
fallback: If Bob doesn't recognize this as a native Skill, execute as Node.js script via execute_command
---

# Orient Skill

## Purpose
Converts any Node/TypeScript repository into a guided tour in under 60 seconds.

## Usage
User invokes `/orient` in Bob IDE while in a Node/TS repo.

## Implementation

### Step 1: Validate Repository
[Codigo/logica usando Bob tools]

### Step 2: Detect Stack
[Codigo/logica usando Bob tools]

[... resto de pasos]

### Output
Generates:
- .orient/report.json
- .orient/architecture.mmd
- AGENTS.md (enriched with Orient block)
```

### Template de AGENTS.md enrichment

```markdown
<!-- ORIENT:START -->
---
> Generated by Orient on [ISO-8601 date]
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

---
<!-- ORIENT:END -->
```

**Regla de insercion**: Si AGENTS.md existe, buscar marcadores. Si existen, reemplazar contenido entre ellos. Si no existen, insertar despues del primer H1. Si AGENTS.md no existe, crear con template completo.

## 3. Diseño del dashboard Next.js

### Estructura de rutas App Router

```
app/
├── layout.tsx              - Root layout, metadata, Tailwind globals
├── page.tsx                - Landing: drag-and-drop + instrucciones
├── report/[id]/page.tsx    - Vista principal con tabs (architecture, start-here, hot-files, onboarding)
└── api/ (NONE - todo client-side)
```

### Componentes principales

```typescript
// components/file-upload.tsx
// Drag-and-drop zone, valida JSON con Zod, guarda en localStorage con UUID, redirect a /report/[id]

// components/architecture-view.tsx
// Renderiza Mermaid diagram + architecture.summary + lista de entryPoints

// components/start-here-view.tsx
// Lista numerada de startHere items con path, why, order. Links clickeables (mock, no abren archivos)

// components/hot-files-view.tsx
// Tabla con columnas: path, commits, uniqueAuthors, score. Sorteable por score desc

// components/onboarding-view.tsx
// Tabs: frontend/backend/fullstack. Checklist interactivo (checkboxes puramente UI, no persisten)

// lib/report-schema.ts
// Zod schema exacto del report.json, exporta type ReportData

// lib/report-store.ts
// Client-side: localStorage.setItem/getItem para reports. Key: `orient-report-${uuid}`
```

### Carga del report.json

```typescript
// Flujo:
// 1. Usuario drag-and-drop en page.tsx
// 2. FileUpload component lee File, JSON.parse, valida con Zod
// 3. Genera UUID, guarda en localStorage
// 4. router.push(`/report/${uuid}`)
// 5. /report/[id]/page.tsx lee de localStorage, renderiza vistas
```

### Las 4 vistas/secciones

1. **Architecture**: Mermaid diagram (mermaid.js client-side), summary text, entry points list
2. **Start Here**: Ordered list (1-7) con path + why. Highlight del #1
3. **Hot Files**: Tabla sorteable, columnas: path, commits, authors, score. Top 30 max
4. **Onboarding**: Tabs por rol (frontend/backend/fullstack), checklist items con checkboxes

### Paquetes npm exactos

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.0",
    "mermaid": "^11.0.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## 4. Riesgos técnicos top-3 con mitigación

**Riesgo 1: Bob Skill format desconocido - no hay docs oficiales de como estructurar skill/orient.md**  
Mitigación: Usar formato markdown literate-coding con frontmatter YAML. Documentar fallback en el skill: si Bob no lo reconoce como Skill nativo, ejecutar como script Node.js via execute_command. Incluir shebang `#!/usr/bin/env node` y hacer el .md ejecutable.

**Riesgo 2: Git log parsing falla en repos sin historial o con paths raros (espacios, caracteres especiales)**  
Mitigación: Wrap git commands en try-catch, si falla devolver hotFiles vacio. Usar `git log --name-only --diff-filter=AM` para evitar renames. Escapar paths con comillas dobles. Test en repo sin .git (devolver error claro).

**Riesgo 3: Mermaid.js rendering en cliente puede fallar con diagramas grandes o sintaxis invalida**  
Mitigación: Generar Mermaid simple (max 20 nodos), validar sintaxis basica antes de escribir (no usar comillas dobles ni parentesis en labels). Fallback en dashboard: try-catch al renderizar, si falla mostrar texto plano del .mmd con mensaje "Diagram too complex to render".

## 5. Cronograma de 22 horas en bloques

### Bloque 1: Setup + Skill Core (3h) - Bobcoins: 3
**Done**: skill/orient.md existe, valida package.json, detecta stack, escribe report.json basico (meta + stack)
- Crear estructura del skill con frontmatter
- Implementar pasos 1-6 del algoritmo
- Test manual en repo simple (ej: create-next-app)

### Bloque 2: Skill Hot Files + Start Here (2h) - Bobcoins: 2
**Done**: git log parsing funciona, hot files calculados, start-here path generado con 5+ items
- Implementar paso 7 (git log)
- Implementar paso 8 (start-here heuristica)
- Test en repo con historial (ej: clonar vercel/next.js, analizar subcarpeta)

### Bloque 3: Skill Mermaid + AGENTS.md (2h) - Bobcoins: 2
**Done**: Mermaid generado, AGENTS.md escrito, report.json completo con todos los campos
- Implementar paso 10 (Mermaid)
- Implementar paso 15 (AGENTS.md enrichment con marcadores)
- Generar examples/sample-output.json desde un repo real

### Bloque 4: Dashboard Scaffold (2h) - Bobcoins: 2
**Done**: Next.js app corre en localhost:3000, Tailwind funciona, rutas creadas
- npx create-next-app@latest dashboard --typescript --tailwind --app
- Configurar tsconfig strict, Tailwind v4
- Crear estructura de rutas + layout basico

### Bloque 5: Dashboard File Upload (1.5h) - Bobcoins: 2
**Done**: Drag-and-drop funciona, valida JSON con Zod, guarda en localStorage, redirect a /report/[id]
- Implementar components/file-upload.tsx
- Implementar lib/report-schema.ts (Zod)
- Implementar lib/report-store.ts
- Test con sample-output.json

### Bloque 6: Dashboard Architecture View (1.5h) - Bobcoins: 2
**Done**: Mermaid renderiza, summary muestra, entry points listados
- Instalar mermaid.js
- Implementar components/architecture-view.tsx
- Test con sample-output.json

### Bloque 7: Dashboard Start Here + Hot Files (2h) - Bobcoins: 2
**Done**: Start Here lista ordenada, Hot Files tabla sorteable
- Implementar components/start-here-view.tsx
- Implementar components/hot-files-view.tsx con sorting
- Test con sample-output.json

### Bloque 8: Dashboard Onboarding View (1.5h) - Bobcoins: 2
**Done**: Tabs frontend/backend/fullstack, checklist interactivo
- Implementar components/onboarding-view.tsx
- Styling con Tailwind
- Test con sample-output.json

### Bloque 9: Integration Testing (2h) - Bobcoins: 3
**Done**: Skill ejecutado en repo real genera report.json valido, dashboard lo renderiza sin errores
- Ejecutar skill en 3 repos diferentes (Next.js, Express, React SPA)
- Cargar reports en dashboard
- Fix bugs criticos

### Bloque 10: Smoke Test + Polish (1.5h) - Bobcoins: 2
**Done**: Smoke test valida report.json shape, README actualizado con instrucciones
- Crear script Node.js que valida sample-output.json con Zod
- Actualizar README con setup instructions
- Fix styling issues en dashboard

### Bloque 11: Demo Prep (2h) - Bobcoins: 2
**Done**: Repo demo seleccionado, skill ejecutado, screenshots tomados, video script escrito
- Clonar repo OSS popular (ej: vercel/swr)
- Ejecutar /orient, capturar proceso
- Escribir docs/video-script.md
- Tomar screenshots para bob_sessions/

### Bloque 12: Video Recording + Submission (2h) - Bobcoins: 3
**Done**: Video de 3 min grabado, bob_sessions exportados, submission materials completos
- Grabar demo siguiendo script
- Exportar Bob sessions a bob_sessions/
- Crear docs/budget-tracking.md
- Final review de submission checklist
- **BONUS si sobra tiempo**: Deploy a Vercel (30min)

**Total Bobcoins presupuestados**: 29 (buffer de 11 coins para overruns)

## 6. Decisiones confirmadas

1. **Formato del Bob Skill**: Markdown estandar + frontmatter YAML. Fallback documentado: si Bob no reconoce formato, ejecutar como script Node.js via execute_command.

2. **AGENTS.md enrichment**: Template minimo con marcadores `<!-- ORIENT:START -->` y `<!-- ORIENT:END -->`. Si AGENTS.md existe, insertar/reemplazar bloque. Si no existe, crear completo. NO sobreescribir documentacion existente.

3. **Deploy a Vercel**: Nice-to-have, NO obligatorio. Demo se graba en localhost. Si sobra tiempo en Bloque 12, hacer deploy como bonus.

## 7. Primeras 3 tareas para Code mode

1. **Crear skill/orient.md con estructura completa**: Frontmatter YAML + secciones de Purpose, Usage, Implementation (pasos 1-15 como pseudocodigo comentado). Incluir nota de fallback.

2. **Crear examples/sample-output.json**: Fixture realista con todos los campos del schema, basado en un repo Next.js tipico. Usar para desarrollo del dashboard sin depender del skill.

3. **Scaffold dashboard Next.js**: Ejecutar `npx create-next-app@latest dashboard --typescript --tailwind --app`, configurar tsconfig.json strict, crear estructura de rutas basica (layout.tsx, page.tsx, report/[id]/page.tsx).

---

**Plan aprobado y listo para ejecucion. Siguiente paso: switch a Code mode.**