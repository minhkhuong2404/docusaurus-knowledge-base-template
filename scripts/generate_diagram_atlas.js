#!/usr/bin/env node
/**
 * Generates src/data/diagramAtlasData.ts by scanning docs/ for *Diagram component imports.
 * Produces a lightweight metadata-only catalog (zero static component imports) so /diagrams
 * stays fast and never bloats the JS bundle.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'docs');
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'diagramAtlasData.ts');

const CATEGORY_MAP = {
  'java': 'Java & JVM',
  'spring': 'Spring & Boot',
  'system-design': 'System Design',
  'database': 'Database Internals',
  'kafka': 'Kafka & Streaming',
  'redis': 'Redis & Caching',
  'networking': 'Networking & Protocols',
  'security': 'Security & Auth',
  'devops': 'DevOps & K8s',
  'aws': 'AWS & Cloud',
  'banking': 'Banking & FinTech',
  'design-patterns': 'Design Patterns',
  'solid': 'Architecture & SOLID',
  'dsa': 'DSA & Algorithms',
  'git': 'Git & Tooling',
  'ai': 'AI & Agents',
  'interview-questions': 'Interview Prep',
  'blockchain': 'Blockchain',
  'operating-systems': 'OS & Linux',
  'testing': 'Testing & QA',
  'books': 'Engineering Books',
};

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

function humanizeComponentName(name) {
  const base = name.replace(/Diagram$/, '');
  return base
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\b2 Pc\b/g, '2PC')
    .replace(/\b3 Pc\b/g, '3PC')
    .replace(/\bDb\b/g, 'DB')
    .replace(/\bSql\b/g, 'SQL')
    .replace(/\bApi\b/g, 'API')
    .replace(/\bJvm\b/g, 'JVM')
    .replace(/\bGc\b/g, 'GC')
    .replace(/\bTcp\b/g, 'TCP')
    .replace(/\bUdp\b/g, 'UDP')
    .replace(/\bTls\b/g, 'TLS')
    .replace(/\bDns\b/g, 'DNS')
    .replace(/\bHttp\b/g, 'HTTP')
    .replace(/\bJwt\b/g, 'JWT')
    .replace(/\bOauth\b/g, 'OAuth')
    .replace(/\bAws\b/g, 'AWS')
    .replace(/\bK8s\b/g, 'K8s')
    .replace(/\bMvcc\b/g, 'MVCC')
    .replace(/\bWal\b/g, 'WAL')
    .replace(/\bAcid\b/g, 'ACID')
    .replace(/\bLsm\b/g, 'LSM')
    .replace(/\bCdc\b/g, 'CDC')
    .replace(/\bCqrs\b/g, 'CQRS')
    .replace(/\bRag\b/g, 'RAG')
    .replace(/\bLlm\b/g, 'LLM')
    .trim();
}

function extractFrontmatter(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return {};
  const fm = fmMatch[1];
  const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const slugMatch = fm.match(/^slug:\s*["']?(.+?)["']?\s*$/m);
  const idMatch = fm.match(/^id:\s*["']?(.+?)["']?\s*$/m);
  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    slug: slugMatch ? slugMatch[1].trim() : null,
    id: idMatch ? idMatch[1].trim() : null,
  };
}

function computeDocPath(filePath, fm) {
  const rel = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  const dir = path.dirname(rel);
  const ext = path.extname(rel);
  const base = path.basename(rel, ext);

  if (fm.slug) {
    if (fm.slug.startsWith('/')) return fm.slug;
    return '/' + path.posix.join(dir === '.' ? '' : dir, fm.slug);
  }
  const fileId = fm.id || base;
  if (fileId === 'index' || fileId === 'intro' && base === 'index') {
    return '/' + (dir === '.' ? '' : dir);
  }
  return '/' + path.posix.join(dir === '.' ? '' : dir, fileId);
}

function detectCategory(relPath) {
  const parts = relPath.split('/');
  if (parts[0] === 'books') return 'Engineering Books';
  if (parts[0] === 'technical-knowledge' && parts[1]) {
    if (CATEGORY_MAP[parts[1]]) return CATEGORY_MAP[parts[1]];
  }
  for (const part of parts) {
    if (CATEGORY_MAP[part]) return CATEGORY_MAP[part];
  }
  return 'System Design';
}

function main() {
  const existingComponents = new Set(
    fs.readdirSync(COMPONENTS_DIR)
      .filter((f) => f.endsWith('Diagram.tsx'))
      .map((f) => f.replace(/\.tsx$/, ''))
  );

  const mdFiles = walk(DOCS_DIR);
  const map = new Map();

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /import\s+\w+\s+from\s+['"]@site\/src\/components\/([A-Za-z0-9_]+Diagram)['"]/g;
    let match;
    const foundInFile = new Set();
    while ((match = importRegex.exec(content)) !== null) {
      const compName = match[1];
      if (existingComponents.has(compName)) {
        foundInFile.add(compName);
      }
    }
    if (foundInFile.size === 0) continue;

    const fm = extractFrontmatter(content);
    const h1Match = content.match(/^#\s+(.+)$/m);
    const docTitle = fm.title || (h1Match ? h1Match[1].replace(/[`*_]/g, '').trim() : path.basename(file, path.extname(file)));
    const docPath = computeDocPath(file, fm);
    const rel = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
    const category = detectCategory(rel);

    for (const compName of foundInFile) {
      if (!map.has(compName)) {
        map.set(compName, {
          id: compName,
          title: humanizeComponentName(compName),
          category,
          docTitle,
          docPath,
        });
      }
    }
  }

  const entries = Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));

  const output = `// Auto-generated by scripts/generate_diagram_atlas.js — do not hand-edit.
// Lightweight metadata catalog of interactive React SVG diagrams (zero static component imports).

export interface DiagramAtlasEntry {
  id: string;
  title: string;
  category: string;
  docTitle: string;
  docPath: string;
}

export const DIAGRAM_ATLAS_TOTAL_COMPONENTS = ${existingComponents.size};

export const DIAGRAM_ATLAS_ENTRIES: DiagramAtlasEntry[] = ${JSON.stringify(entries, null, 2)};
`;

  fs.writeFileSync(OUT_FILE, output, 'utf8');
  console.log(`Generated ${entries.length} mapped diagrams (${existingComponents.size} total *Diagram.tsx components) -> ${OUT_FILE}`);
}

main();
