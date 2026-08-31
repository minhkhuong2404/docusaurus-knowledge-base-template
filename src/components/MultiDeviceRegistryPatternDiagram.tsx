import React, { useState } from 'react';

type PatternType = 'relational' | 'redis-hash' | 'keystore';

interface PatternData {
  id: PatternType;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  schemaTitle: string;
  codeSnippet: string;
  advantages: string[];
  tradeoffs: string[];
}

const PATTERNS: PatternData[] = [
  {
    id: 'relational',
    title: 'Pattern A: Relational Session Registry',
    subtitle: 'PostgreSQL / MySQL user_sessions Table',
    badge: 'ACID DURABILITY',
    badgeColor: '#38bdf8',
    description: 'Each login inserts a row in a relational user_sessions table linking user_id, device_id, session_id, and family_id.',
    schemaTitle: 'PostgreSQL Schema (user_sessions)',
    codeSnippet: `-- Schema: 1 User ➔ N Device Sessions
CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       VARCHAR(64) NOT NULL,        -- Hardware/Browser fingerprint
    device_name     VARCHAR(100),                -- "iPhone 15 Pro (Safari)"
    session_id      VARCHAR(64) NOT NULL UNIQUE, -- Instance ID
    family_id       UUID NOT NULL,               -- Token Family for RTR theft check
    token_hash      VARCHAR(64) NOT NULL UNIQUE, -- SHA-256(refresh_token)
    is_used         BOOLEAN DEFAULT FALSE,
    is_revoked      BOOLEAN DEFAULT FALSE,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Targeted Single-Device Logout:
UPDATE user_sessions SET is_revoked = TRUE 
WHERE user_id = :uid AND session_id = :currentSessionId;`,
    advantages: [
      'Full ACID compliance and transactional guarantees',
      'Rich audit log of active devices, login IPs, and session history',
      'Cascading foreign key deletes on user account deletion'
    ],
    tradeoffs: [
      'Database I/O required on every token refresh request',
      'Requires periodic cron vacuum/cleanup of expired session rows'
    ]
  },
  {
    id: 'redis-hash',
    title: 'Pattern B: Redis Hash Device Map',
    subtitle: 'High-Throughput In-Memory Session Cache',
    badge: 'SUB-MILLISECOND',
    badgeColor: '#34d399',
    description: 'Sessions are stored inside a Redis Hash keyed by user ID. Individual devices are mapped by session_id field.',
    schemaTitle: 'Redis Commands & Hash Structure',
    codeSnippet: `# Store session on Device Login:
HSET user:usr_404:sessions sess_mob_101 '{"devId":"mob_1","familyId":"f_A","hash":"sha256..."}'
HSET user:usr_404:sessions sess_lap_202 '{"devId":"lap_2","familyId":"f_B","hash":"sha256..."}'
EXPIRE user:usr_404:sessions 2592000 # 30 days TTL

# 1. Single-Device Logout (Isolated):
HDEL user:usr_404:sessions sess_mob_101  # O(1) operation! Laptop session unaffected!

# 2. Get All Active Devices (Profile UI):
HGETALL user:usr_404:sessions

# 3. Global Logout ("Logout Everywhere"):
DEL user:usr_404:sessions                # Wipes all sessions instantly!`,
    advantages: [
      'Sub-millisecond latency (O(1) HDEL / HSET operations)',
      'Native automatic expiration via Redis key TTL',
      'Extremely easy to query list of all user devices with HGETALL'
    ],
    tradeoffs: [
      'Requires persistent Redis cluster or write-through DB synchronization',
      'RAM consumption scales with total active sessions in the system'
    ]
  },
  {
    id: 'keystore',
    title: 'Pattern C: KeyStore / Key-Token Model',
    subtitle: 'Anonystick / Tips Javascript Per-Device Security',
    badge: 'THEFT PROOF',
    badgeColor: '#a78bfa',
    description: 'Each client device generates or receives its own unique KeyStore containing device-specific keys and a refreshTokensUsed array to catch token replay attacks.',
    schemaTitle: 'KeyStore Document / Record Structure',
    codeSnippet: `// KeyStore Structure per Device Login:
{
  "_id": "ks_991823",
  "userId": "usr_404",
  "deviceId": "dev_mobile_91a",
  "publicKey": "-----BEGIN PUBLIC KEY...-----",
  "refreshToken": "rt_live_sha256_hash",
  "refreshTokensUsed": [
    "rt_v1_sha256_hash", 
    "rt_v2_sha256_hash"
  ],
  "updatedAt": "2026-08-20T22:00:00Z"
}

// Single Logout: Delete ONLY this KeyStore:
await KeyTokenService.deleteByDeviceId({ userId, deviceId });

// On Stolen Token Replay (RT in refreshTokensUsed):
// 🚨 Trigger emergency purge across ALL KeyStores for this user!`,
    advantages: [
      'Dedicated cryptographic isolation per client device',
      'Built-in replay detection array (refreshTokensUsed) detects stolen tokens immediately',
      'Isolated deletion guarantees other devices never face session cross-contamination'
    ],
    tradeoffs: [
      'Requires tracking historical used tokens per device',
      'Key rotation logic requires careful concurrency handling'
    ]
  }
];

export default function MultiDeviceRegistryPatternDiagram(): React.JSX.Element {
  const [activePattern, setActivePattern] = useState<PatternType>('relational');

  const current = PATTERNS.find((p) => p.id === activePattern) ?? PATTERNS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .pattern-grid {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .pattern-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Multi-Device Session Registry Architecture Patterns
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {PATTERNS.map((pat) => (
          <button
            key={pat.id}
            onClick={() => setActivePattern(pat.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${activePattern === pat.id ? pat.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
              background: activePattern === pat.id ? `${pat.badgeColor}18` : 'transparent',
              color: activePattern === pat.id ? pat.badgeColor : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {pat.title}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '16px' }}>
        {/* Animated SVG Flow Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="reg-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="reg-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="reg-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Devices Left Column */}
            <rect x="25" y="15" width="130" height="45" rx="6" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="90" y="35" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">📱 Mobile App</text>
            <text x="90" y="49" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">devId: mob_101</text>

            <rect x="25" y="80" width="130" height="45" rx="6" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="90" y="100" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">💻 Laptop Web</text>
            <text x="90" y="114" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">devId: lap_202</text>

            {/* Moving paths to Auth Gateway */}
            <path d="M 155 37 L 260 55" stroke="rgba(56,189,248,0.3)" strokeWidth="2" fill="none" />
            <path d="M 155 37 L 260 55" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#reg-arr-blue)" />

            <path d="M 155 102 L 260 85" stroke="rgba(56,189,248,0.3)" strokeWidth="2" fill="none" />
            <path d="M 155 102 L 260 85" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#reg-arr-blue)" />

            {/* Auth Gateway */}
            <rect x="265" y="40" width="150" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
            <text x="340" y="66" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Auth Gateway</text>
            <text x="340" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Session Validator</text>

            {/* Moving path to Registry */}
            <line x1="415" y1="70" x2="495" y2="70" stroke="rgba(167,139,250,0.3)" strokeWidth="2" />
            <line x1="415" y1="70" x2="495" y2="70" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#reg-arr-purple)" />

            {/* Registry Storage */}
            <rect x="500" y="40" width="155" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="577" y="66" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">
              {activePattern === 'relational' ? 'PostgreSQL Registry' : activePattern === 'redis-hash' ? 'Redis Hash Map' : 'Device KeyStore DB'}
            </text>
            <text x="577" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
              {activePattern === 'relational' ? 'user_sessions table' : activePattern === 'redis-hash' ? 'O(1) HDEL / HGETALL' : 'refreshTokensUsed array'}
            </text>
          </svg>
        </div>

        <div className="pattern-grid">
          {/* Left Column: Code / Schema Implementation */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: current.badgeColor }}>
                {current.schemaTitle}
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 700 }}>
                {current.badge}
              </span>
            </div>

            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', background: 'var(--ifm-background-surface-color)', fontSize: '11px', lineHeight: 1.45, overflowX: 'auto', border: '1px solid var(--ifm-color-emphasis-300)' }}>
              <code>{current.codeSnippet}</code>
            </pre>
          </div>

          {/* Right Column: Architectural Analysis */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: current.badgeColor }}>
              {current.subtitle}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.description}
            </p>

            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              Key Advantages:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              {current.advantages.map((adv, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> <span>{adv}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              Engineering Trade-offs:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {current.tradeoffs.map((tro, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠</span> <span>{tro}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
