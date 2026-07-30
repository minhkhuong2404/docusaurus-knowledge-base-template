/**
 * generate_master_hash.mjs
 * ─────────────────────────────────────────────────────────
 * Generates AUTH_PASSWORD_SALT and AUTH_PASSWORD_HASH for
 * the master premium unlock key.
 *
 * Usage:
 *   node scratch/generate_master_hash.mjs
 *
 * The script prompts you for your password without echoing
 * it, then prints the two env-var lines you need.
 * ─────────────────────────────────────────────────────────
 */

import { webcrypto } from 'node:crypto';
import * as readline from 'node:readline/promises';
import { stdin, stdout, stderr } from 'node:process';

const { subtle } = webcrypto;

// ── helpers ────────────────────────────────────────────────

function toHex(buf) {
  return Buffer.from(buf).toString('hex');
}

async function deriveHash(password, saltHex) {
  const enc  = new TextEncoder();
  const salt = Buffer.from(saltHex, 'hex');

  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const bits = await subtle.deriveBits(
    {
      name:       'PBKDF2',
      salt,
      iterations: 310_000,   // OWASP 2023 minimum for SHA-256
      hash:       'SHA-256',
    },
    keyMaterial,
    256,
  );

  return toHex(bits);
}

// ── main ───────────────────────────────────────────────────

const rl = readline.createInterface({ input: stdin, output: stderr });

stderr.write('\n🔐  Master Password Hash Generator\n');
stderr.write('─────────────────────────────────────\n');
stderr.write('Your password will NOT be displayed.\n\n');

const password = await rl.question('Enter new master password: ');
rl.close();

if (!password || !password.trim()) {
  stderr.write('\n❌  Empty password — aborting.\n');
  process.exit(1);
}

stderr.write('\n⏳  Deriving hash (310 000 PBKDF2 iterations)...\n');

// Generate a random 32-byte salt
const saltBytes = new Uint8Array(32);
webcrypto.getRandomValues(saltBytes);
const saltHex = toHex(saltBytes);

const hashHex = await deriveHash(password, saltHex);

stdout.write(`\n# ── Copy these two lines into your .env file and Cloudflare Worker secrets ──\n`);
stdout.write(`AUTH_PASSWORD_SALT=${saltHex}\n`);
stdout.write(`AUTH_PASSWORD_HASH=${hashHex}\n`);
stderr.write('\n✅  Done — copy the two lines above into your .env and Cloudflare Worker secrets.\n\n');
