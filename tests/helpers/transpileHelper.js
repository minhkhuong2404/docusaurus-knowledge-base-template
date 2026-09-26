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

/**
 * Transpiles TypeScript / TSX source to executable JavaScript.
 */
function transpileCode(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = babel.transformSync(content, {
    presets: [
      require.resolve('@babel/preset-typescript'),
      [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
    filename: filePath,
  });
  return result.code;
}

/**
 * Strips types, compiles JSX, and analyzes the AST scope to find
 * any runtime identifiers that are referenced without declaration in scope.
 * Catches missing handlers, undefined variables, and typo bugs before deployment.
 */
function getUndeclaredIdentifiers(filePath) {
  const jsCode = transpileCode(filePath);
  const ast = parser.parse(jsCode, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  const undeclared = new Set();

  traverse(ast, {
    ReferencedIdentifier(p) {
      const name = p.node.name;
      if (STANDARD_GLOBALS.has(name)) return;
      if (!p.scope.hasBinding(name)) {
        undeclared.add(name);
      }
    },
  });

  return Array.from(undeclared);
}

/**
 * Dynamically loads and evaluates a TypeScript data or service module in Node.js.
 */
function loadTsModule(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = babel.transformSync(content, {
    presets: [
      require.resolve('@babel/preset-typescript'),
      [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
      [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    ],
    filename: filePath,
  });

  const m = { exports: {} };
  const absPath = path.resolve(filePath);
  const dir = path.dirname(absPath);
  const fn = new Function('exports', 'module', 'require', '__dirname', '__filename', result.code);
  fn(m.exports, m, require, dir, absPath);
  return m.exports;
}

/**
 * Validates that JSX text nodes do not contain unescaped characters (> or })
 * which pass through Babel but fail in strict JSX compilers like SWC / Rspack.
 */
function validateJsxEntities(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const unescaped = [];
  traverse(ast, {
    JSXText(p) {
      const raw = p.node.extra?.raw || p.node.raw || '';
      if (/[>}]/.test(raw)) {
        unescaped.push({
          line: p.node.loc.start.line,
          text: raw.trim(),
        });
      }
    },
  });
  return unescaped;
}

module.exports = {
  transpileCode,
  getUndeclaredIdentifiers,
  validateJsxEntities,
  loadTsModule,
  STANDARD_GLOBALS,
};

