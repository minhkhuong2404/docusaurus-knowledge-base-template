const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const dir = 'docs/technical-knowledge/networking/';
const expectations = {
  'ip-addressing-routing.md': ['Subnetting Worked Example', 'longest prefix match', 'DORA', 'Translation Table'],
  'tcp-udp-transport-layer.md': ['TCP vs UDP: Choosing', 'WebSocket', '101 Switching Protocols', 'CLOSE_WAIT', 'Path MTU', 'TCP_NODELAY', 'Nagle', 'Amplification attacks'],
  'dns-resolution.md': ['ndots', 'Negative Caching', 'TC (truncated) bit', 'Happy Eyeballs', 'NodeLocal DNSCache', 'zone apex'],
  'osi-tcpip-models.md': ['Journey of a Request', 'default gateway', 'Where Each Middlebox Sits'],
  'network-performance-optimization.md': ['Latency Hierarchy', 'NIC Ring Buffers', 'Bufferbloat', 'FQ-CoDel', 'BBR vs CUBIC', 'kTLS'],
  'socket-programming-io-models.md': ['5 Linux I/O Models', 'EPOLLET', 'SO_REUSEPORT', 'sendfile', 'Carrier Thread Pinning'],
  'network-security.md': ['OCSP Stapling', 'HSTS', 'Anti-Replay Architecture', 'RPKI', 'NAT-T', 'SYN Cookies', 'Slowloris'],
  'quic-modern-transport.md': ['Anti-Amplification', 'Stateless Reset Tokens', 'GSO'],
  'api-authentication-security.md': ['Timing Attacks', 'PKCE', 'DPoP', 'SPIFFE'],
  'networking-interview-questions.md': ['nf_conntrack', 'XDP', 'MTU Black Hole', 'CLOSE_WAIT'],
  'index.md': ['Speed of light latency hierarchy', '5 Linux I/O models']
};

describe('Networking Knowledge Base Verification Suite', () => {
  for (const [file, keywords] of Object.entries(expectations)) {
    it(`${file} contains all required architectural concepts`, () => {
      const content = fs.readFileSync(dir + file, 'utf8');
      for (const kw of keywords) {
        assert.ok(content.includes(kw), `Missing "${kw}" in ${file}`);
      }
    });

    it(`${file} has no unescaped MDX expressions in prose`, () => {
      let cleaned = fs.readFileSync(dir + file, 'utf8').replace(/^---[\s\S]*?---/, '');
      cleaned = cleaned.replace(/^import\s+.*$/gm, '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, 'code');
      cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]+\$/g, '');
      assert.strictEqual(cleaned.match(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}/g), null);
    });

    it(`${file} relative markdown links resolve to existing files`, () => {
      const content = fs.readFileSync(dir + file, 'utf8');
      const links = [...content.matchAll(/\]\((\.[^)#\s]+\.md)\)/g)].map((m) => m[1]);
      for (const l of links) {
        const targetPath = path.resolve(dir, l);
        assert.ok(fs.existsSync(targetPath), `Broken link in ${file}: "${l}" -> "${targetPath}"`);
      }
    });
  }
});
