const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * Cross-platform test runner for Node.js test suite.
 * Resolves test files explicitly to prevent POSIX /bin/sh (dash) glob expansion issues on Linux CI.
 */
function getTestFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'helpers') {
      files = files.concat(getTestFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.test.js') || entry.name.endsWith('.test.mjs') || entry.name.endsWith('.test.cjs'))) {
      files.push(fullPath);
    }
  }
  return files;
}

const testsDir = path.resolve(__dirname, '../tests');
const testFiles = getTestFiles(testsDir);

if (testFiles.length === 0) {
  console.error('No test files found in tests/');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 0);
