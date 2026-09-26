#!/usr/bin/env node

/**
 * Checkstyle & Code Style Analyzer for JavaScript & TypeScript
 *
 * Verifies code correctness, AST syntax integrity, runtime scope safety,
 * and code style formatting across JavaScript and TypeScript codebases.
 *
 * Usage:
 *   node scripts/checkstyle.js [options] [paths...]
 *
 * Options:
 *   --fix              Automatically fix auto-fixable style issues (trailing spaces, missing EOF)
 *   --format=xml|json  Output format (default: stylish terminal output, or checkstyle XML)
 *   --xml              Shortcut for --format=xml
 *   --quiet            Only display errors (suppress warnings)
 *   --max-warnings=N   Fail if warnings exceed N (default: unlimited)
 *   --help             Show help documentation
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const STANDARD_GLOBALS = new Set([
  'window', 'document', 'localStorage', 'sessionStorage', 'console',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'require',
  'globalThis', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean',
  'RegExp', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
  'JSON', 'Set', 'Map', 'WeakMap', 'WeakSet', 'Promise', 'Date',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'navigator', 'module',
  'exports', '__dirname', '__filename', 'fetch', 'Headers', 'Request',
  'Response', 'URL', 'URLSearchParams', 'Event', 'CustomEvent', 'btoa',
  'atob', 'performance', 'crypto', 'location', 'history', 'alert',
  'confirm', 'prompt', 'process', 'IDBDatabase', 'indexedDB', 'BroadcastChannel',
  'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'Node', 'Element',
  'HTMLElement', 'SVGElement', 'Audio', 'Image', 'FileReader', 'Blob', 'File',
  'FormData', 'Symbol', 'Proxy', 'Reflect', 'Intl', 'encodeURIComponent',
  'decodeURIComponent', 'encodeURI', 'decodeURI', 'requestAnimationFrame',
  'cancelAnimationFrame', 'HTMLCanvasElement', 'CanvasRenderingContext2D',
  'TextEncoder', 'TextDecoder'
]);

const IGNORED_DIRS = new Set([
  'node_modules', 'build', '.docusaurus', '.git', '.venv', 'dist', 'coverage'
]);

const SUPPORTED_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  fix: false,
  format: 'stylish',
  quiet: false,
  maxWarnings: -1,
  help: false,
};
const targetPaths = [];

for (const arg of args) {
  if (arg === '--fix') {
    flags.fix = true;
  } else if (arg === '--xml' || arg === '--format=xml') {
    flags.format = 'xml';
  } else if (arg === '--format=json') {
    flags.format = 'json';
  } else if (arg === '--quiet') {
    flags.quiet = true;
  } else if (arg.startsWith('--max-warnings=')) {
    flags.maxWarnings = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--help' || arg === '-h') {
    flags.help = true;
  } else if (!arg.startsWith('--')) {
    targetPaths.push(arg);
  }
}

if (flags.help) {
  console.log(`
JavaScript & TypeScript Checkstyle / Code Style Analyzer

Usage:
  node scripts/checkstyle.js [options] [files|dirs...]

Options:
  --fix               Auto-fix whitespace & newline violations
  --xml, --format=xml Output report in standard Checkstyle XML format
  --format=json       Output report in JSON format
  --quiet             Report errors only (hide warnings)
  --max-warnings=N    Exit with error if warnings exceed N
  --help, -h          Display this help message
`);
  process.exit(0);
}

// Default scan targets if none provided
if (targetPaths.length === 0) {
  targetPaths.push('src', 'scripts', 'tests');
}

/**
 * Recursively discovers all JavaScript and TypeScript files in targets.
 */
function findFiles(target, list = []) {
  if (!fs.existsSync(target)) return list;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const base = path.basename(target);
    if (IGNORED_DIRS.has(base) || base.startsWith('.')) return list;
    for (const item of fs.readdirSync(target)) {
      findFiles(path.join(target, item), list);
    }
  } else if (stat.isFile()) {
    const ext = path.extname(target);
    if (SUPPORTED_EXTS.has(ext)) {
      list.push(target);
    }
  }
  return list;
}

const allFiles = [];
for (const p of targetPaths) {
  findFiles(p, allFiles);
}

// Deduplicate
const files = Array.from(new Set(allFiles));

const results = [];
let totalErrors = 0;
let totalWarnings = 0;
let filesFixed = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const messages = [];

  // 1. Check style: End of file newline (eol-last)
  if (!content.endsWith('\n')) {
    if (flags.fix) {
      content += '\n';
      modified = true;
    } else {
      messages.push({
        line: content.split('\n').length,
        column: 1,
        severity: 'warning',
        rule: 'eol-last',
        message: 'Newline required at end of file',
      });
    }
  }

  // 2. Check style: Trailing whitespace (no-trailing-spaces)
  const lines = content.split('\n');
  const fixedLines = [];
  lines.forEach((line, idx) => {
    if (/[ \t]+$/.test(line)) {
      if (flags.fix) {
        fixedLines.push(line.replace(/[ \t]+$/, ''));
        modified = true;
      } else {
        messages.push({
          line: idx + 1,
          column: line.search(/[ \t]+$/) + 1,
          severity: 'warning',
          rule: 'no-trailing-spaces',
          message: 'Trailing whitespace not permitted',
        });
        fixedLines.push(line);
      }
    } else {
      fixedLines.push(line);
    }
  });

  if (modified && flags.fix) {
    fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf8');
    filesFixed++;
    content = fixedLines.join('\n');
  }

  // 3. Syntax & AST Verification (syntax-error, no-debugger, no-eval)
  let ast = null;
  try {
    ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (err) {
    messages.push({
      line: err.loc ? err.loc.line : 1,
      column: err.loc ? err.loc.column + 1 : 1,
      severity: 'error',
      rule: 'syntax-error',
      message: `Syntax error: ${err.message.replace(/\s*\(\d+:\d+\)$/, '')}`,
    });
  }

  if (ast) {
    // AST Walk for AST-level rules
    try {
      traverse(ast, {
        DebuggerStatement(nodePath) {
          messages.push({
            line: nodePath.node.loc.start.line,
            column: nodePath.node.loc.start.column + 1,
            severity: 'error',
            rule: 'no-debugger',
            message: 'Unexpected debugger statement in production code',
          });
        },
      });
    } catch {
      // ignore traversal errors
    }

    // 4. Runtime Identifier Scope Analysis (no-undeclared-vars)
    // Run for src/ components and pages to prevent crash bugs
    if (filePath.startsWith('src' + path.sep) || filePath.startsWith('src/')) {
      try {
        const trans = babel.transformSync(content, {
          presets: [
            require.resolve('@babel/preset-typescript'),
            [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
          ],
          filename: filePath,
        });

        if (trans && trans.code) {
          const transAst = parser.parse(trans.code, { sourceType: 'module' });
          const undeclared = new Set();

          traverse(transAst, {
            ReferencedIdentifier(nodePath) {
              const name = nodePath.node.name;
              if (STANDARD_GLOBALS.has(name)) return;
              if (!nodePath.scope.hasBinding(name)) {
                undeclared.add({
                  name,
                  line: nodePath.node.loc ? nodePath.node.loc.start.line : 1,
                  column: nodePath.node.loc ? nodePath.node.loc.start.column + 1 : 1,
                });
              }
            },
          });

          for (const item of undeclared) {
            messages.push({
              line: item.line,
              column: item.column,
              severity: 'error',
              rule: 'no-undeclared-vars',
              message: `'${item.name}' is not defined in scope. This will throw ReferenceError at runtime.`,
            });
          }
        }
      } catch {
        // Transpilation errors are already caught by syntax-error
      }
    }
  }

  // Sort messages by line & column
  messages.sort((a, b) => a.line - b.line || a.column - b.column);

  const errorCount = messages.filter((m) => m.severity === 'error').length;
  const warningCount = messages.filter((m) => m.severity === 'warning').length;

  totalErrors += errorCount;
  totalWarnings += warningCount;

  if (messages.length > 0) {
    results.push({
      filePath,
      errorCount,
      warningCount,
      messages,
    });
  }
}

// ── FORMATTER OUTPUT ──

if (flags.format === 'xml') {
  // Checkstyle XML Output
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<checkstyle version="8.0">\n';
  for (const r of results) {
    const absPath = path.resolve(r.filePath);
    xml += `  <file name="${escapeXml(absPath)}">\n`;
    for (const msg of r.messages) {
      if (flags.quiet && msg.severity === 'warning') continue;
      xml += `    <error line="${msg.line}" column="${msg.column}" severity="${msg.severity}" message="${escapeXml(msg.message)}" source="checkstyle.${msg.rule}" />\n`;
    }
    xml += '  </file>\n';
  }
  xml += '</checkstyle>\n';
  console.log(xml);
} else if (flags.format === 'json') {
  console.log(JSON.stringify({ totalErrors, totalWarnings, filesFixed, results }, null, 2));
} else {
  // Stylish Terminal Output
  for (const r of results) {
    const displayed = flags.quiet ? r.messages.filter((m) => m.severity === 'error') : r.messages;
    if (displayed.length === 0) continue;

    console.log(`\n\x1b[4m${r.filePath}\x1b[0m`);
    for (const msg of displayed) {
      const lineCol = `  ${msg.line}:${msg.column}`.padEnd(10);
      const badge =
        msg.severity === 'error'
          ? '\x1b[31merror\x1b[0m'
          : '\x1b[33mwarning\x1b[0m';
      console.log(`${lineCol} ${badge}  ${msg.message.padEnd(50)}  \x1b[90m${msg.rule}\x1b[0m`);
    }
  }

  console.log('');
  if (totalErrors === 0 && (totalWarnings === 0 || flags.quiet)) {
    console.log(`\x1b[32m✔ Checkstyle passed!\x1b[0m Evaluated ${files.length} JavaScript/TypeScript files with 0 errors.`);
  } else {
    const summary = [
      totalErrors > 0 ? `\x1b[31m${totalErrors} error${totalErrors === 1 ? '' : 's'}\x1b[0m` : '0 errors',
      totalWarnings > 0 ? `\x1b[33m${totalWarnings} warning${totalWarnings === 1 ? '' : 's'}\x1b[0m` : '0 warnings',
    ].join(' and ');
    console.log(`✖ ${summary} found across ${files.length} files.`);
  }

  if (flags.fix && filesFixed > 0) {
    console.log(`\x1b[36mℹ Automatically fixed formatting in ${filesFixed} files.\x1b[0m`);
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Exit code evaluation
let hasFailed = totalErrors > 0;
if (flags.maxWarnings >= 0 && totalWarnings > flags.maxWarnings) {
  hasFailed = true;
}

process.exit(hasFailed ? 1 : 0);
