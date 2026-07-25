import React, { useState } from 'react';

type InvalidationMode = 'rotation' | 'single_device' | 'account_hacked';

interface ModeInfo {
  id: InvalidationMode;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  highlights: {
    title: string;
    details: string;
    codeSnippet?: string;
  }[];
}

const MODES: ModeInfo[] = [
  {
    id: 'rotation',
    label: '1. Refresh Token Rotation (RTR)',
    badge: 'Standard Security',
    badgeColor: '#38bdf8',
    description: 'Every refresh attempt revokes the old refresh token and issues a brand-new token pair. If a revoked/used token is submitted, the system flags theft and immediately destroys the entire token family.',
    highlights: [
      {
        title: 'Rotated Token Pair',
        details: 'Short-lived Access Token (10 min) + Single-use Refresh Token (30 days). Once used, RefreshToken v1 is marked as used.',
      },
      {
        title: 'Reuse Detection Trigger',
        details: 'If an attacker replays RefreshToken v1 after the legitimate client already rotated to v2, the server detects token reuse.',
        codeSnippet: 'if (token.isUsed()) { revokeFamily(token.familyId); throw new TokenReuseException(); }'
      }
    ]
  },
  {
    id: 'single_device',
    label: '2. Single-Device Password Update',
    badge: 'Selective Invalidation',
    badgeColor: '#34d399',
    description: 'User changes password on Device A and chooses "Stay logged in on this device". Device A session remains valid while all other device sessions (Device B, C) are deleted from DB/Redis.',
    highlights: [
      {
        title: 'Targeted Revocation Query',
        details: 'Keep current session_id active for Device A. Delete all other refresh token records matching user_id.',
        codeSnippet: 'DELETE FROM refresh_tokens WHERE user_id = :uid AND session_id != :current_session_id;'
      },
      {
        title: 'Seamless User Experience',
        details: 'Device A receives a newly signed access token tied to the new password credentials without forcing re-login.',
      }
    ]
  },
  {
    id: 'account_hacked',
    label: '3. Account Hacked / Global Reset',
    badge: 'Emergency Revocation',
    badgeColor: '#f43f5e',
    description: 'Account compromised or user selects "Log out all devices". Increments token_version (or sets pwd_updated_at), wipes ALL refresh tokens, and broadcasts revocation timestamp to Redis so stateless access tokens expire immediately.',
    highlights: [
      {
        title: 'Closing the Access Token Gap',
        details: 'Stateless access tokens normally live for 10 min. Gateway checks JWT iat against cached user pwd_updated_at in Redis.',
        codeSnippet: 'UPDATE users SET token_version = token_version + 1, pwd_updated_at = NOW() WHERE id = :uid;\nREDIS: SET user:revoked_before:<uid> = NOW() EX 600;'
      },
      {
        title: 'Immediate Enforcement',
        details: 'Any API request with access token iat < pwd_updated_at is instantly rejected with HTTP 401 Unauthorized.',
      }
    ]
  }
];

export default function TokenInvalidationFlowDiagram(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<InvalidationMode>('rotation');

  const currentModeInfo = MODES.find((m) => m.id === activeMode) || MODES[0];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ifm-color-content)' }}>
            Refresh & Access Token Invalidation Architecture
          </span>
        </div>

        {/* Mode Selector Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {MODES.map((m) => {
            const isActive = m.id === activeMode;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                style={{
                  background: isActive ? `${m.badgeColor}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? m.badgeColor : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? m.badgeColor : 'var(--ifm-color-content-secondary)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Flow Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '1.25rem 0' }}>
        <svg viewBox="0 0 800 280" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="context-fill" />
            </marker>

            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Node 1: Device A (Legitimate / Current) */}
          <g transform="translate(60, 40)" filter="url(#shadow)">
            <rect x="0" y="0" width="130" height="70" rx="8" fill="#0f172a" stroke="#34d399" strokeWidth="1.8" />
            <text x="65" y="24" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">📱 Device A (Current)</text>
            <text x="65" y="42" fill="#94a3b8" fontSize="9" textAnchor="middle">Session: sess_101</text>
            <text x="65" y="56" fill="#64748b" fontSize="8" textAnchor="middle">TokenVer: v1</text>
          </g>

          {/* Node 2: Device B (Remote / Stolen) */}
          <g transform="translate(60, 165)" filter="url(#shadow)">
            <rect
              x="0"
              y="0"
              width="130"
              height="70"
              rx="8"
              fill="#0f172a"
              stroke={activeMode === 'single_device' || activeMode === 'account_hacked' ? '#f43f5e' : '#fb923c'}
              strokeWidth="1.8"
              strokeDasharray={activeMode !== 'rotation' ? '4,3' : 'none'}
            />
            <text
              x="65"
              y="24"
              fill={activeMode === 'single_device' || activeMode === 'account_hacked' ? '#f43f5e' : '#fb923c'}
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
            >
              💻 Device B {activeMode !== 'rotation' ? '(Evicted)' : '(Remote)'}
            </text>
            <text x="65" y="42" fill="#94a3b8" fontSize="9" textAnchor="middle">Session: sess_202</text>
            <text x="65" y="56" fill="#64748b" fontSize="8" textAnchor="middle">TokenVer: v1</text>
          </g>

          {/* Node 3: API Gateway & Auth Server */}
          <g transform="translate(320, 100)" filter="url(#shadow)">
            <rect x="0" y="0" width="160" height="85" rx="8" fill="#0f172a" stroke="#a78bfa" strokeWidth="2" />
            <text x="80" y="25" fill="#a78bfa" fontSize="12" fontWeight="700" textAnchor="middle">🛡️ API Gateway / Auth</text>
            <text x="80" y="44" fill="#cbd5e1" fontSize="9.5" textAnchor="middle">JWT Verification Filter</text>
            <text x="80" y="60" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Checks iat vs pwd_updated_at</text>
            <text x="80" y="73" fill="#64748b" fontSize="8" textAnchor="middle">Verifies Token Version</text>
          </g>

          {/* Node 4: Database (Refresh Tokens Table) */}
          <g transform="translate(590, 35)" filter="url(#shadow)">
            <rect x="0" y="0" width="150" height="75" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="75" y="23" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">🗄️ Primary Database</text>
            <text x="75" y="40" fill="#94a3b8" fontSize="9" textAnchor="middle">users (token_version)</text>
            <text x="75" y="54" fill="#94a3b8" fontSize="9" textAnchor="middle">refresh_tokens (family_id)</text>
          </g>

          {/* Node 5: Redis Revocation Cache */}
          <g transform="translate(590, 160)" filter="url(#shadow)">
            <rect x="0" y="0" width="150" height="75" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
            <text x="75" y="23" fill="#f59e0b" fontSize="11" fontWeight="700" textAnchor="middle">⚡ Redis Cache</text>
            <text x="75" y="40" fill="#94a3b8" fontSize="9" textAnchor="middle">user:revoked_before:&lt;uid&gt;</text>
            <text x="75" y="55" fill="#64748b" fontSize="8.5" textAnchor="middle">TTL = Access Token max_exp</text>
          </g>

          {/* Connections & Flows according to Active Mode */}
          {activeMode === 'rotation' && (
            <>
              {/* Device A -> Gateway */}
              <path id="flow-a" d="M 190 75 L 320 120" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-blue)" fillOpacity="1" contextFill="#34d399" />
              <text x="245" y="88" fill="#34d399" fontSize="8.5" fontWeight="600" textAnchor="middle">POST /refresh (v1)</text>
              <circle r="3.5" fill="#34d399"><animateMotion dur="2s" repeatCount="indefinite"><mpath href="#flow-a" /></animateMotion></circle>

              {/* Gateway -> DB */}
              <path id="flow-db" d="M 480 125 L 590 75" fill="none" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#arrow-blue)" contextFill="#38bdf8" />
              <text x="545" y="92" fill="#38bdf8" fontSize="8" textAnchor="middle">Rotate v1→v2 & Set Used</text>

              {/* Device B Theft Attempt -> Gateway */}
              <path id="flow-b" d="M 190 200 L 320 160" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeDasharray="4,2" markerEnd="url(#arrow-blue)" contextFill="#f43f5e" />
              <text x="245" y="195" fill="#f43f5e" fontSize="8.5" fontWeight="600" textAnchor="middle">Replay Stale v1 🚨</text>
              <circle r="3.5" fill="#f43f5e"><animateMotion dur="1.5s" repeatCount="indefinite"><mpath href="#flow-b" /></animateMotion></circle>
            </>
          )}

          {activeMode === 'single_device' && (
            <>
              {/* Device A Update Password -> Gateway */}
              <path id="flow-pass-a" d="M 190 75 L 320 120" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-blue)" contextFill="#34d399" />
              <text x="240" y="88" fill="#34d399" fontSize="8.5" fontWeight="600" textAnchor="middle">Update Password (Keep Current)</text>
              <circle r="3.5" fill="#34d399"><animateMotion dur="2s" repeatCount="indefinite"><mpath href="#flow-pass-a" /></animateMotion></circle>

              {/* Gateway -> DB Selective Delete */}
              <path id="flow-pass-db" d="M 480 125 L 590 75" fill="none" stroke="#34d399" strokeWidth="1.8" markerEnd="url(#arrow-blue)" contextFill="#34d399" />
              <text x="540" y="92" fill="#34d399" fontSize="8" textAnchor="middle">DELETE session_id != sess_101</text>

              {/* Device B Attempted Access -> Gateway REJECTED */}
              <path id="flow-b-rej" d="M 190 200 L 320 160" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#arrow-blue)" contextFill="#f43f5e" />
              <text x="250" y="198" fill="#f43f5e" fontSize="8.5" fontWeight="600" textAnchor="middle">401 Session Deleted ❌</text>
            </>
          )}

          {activeMode === 'account_hacked' && (
            <>
              {/* Emergency Trigger -> Gateway */}
              <path id="flow-hack-trigger" d="M 190 75 L 320 120" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-blue)" contextFill="#f43f5e" />
              <text x="235" y="85" fill="#f43f5e" fontSize="8.5" fontWeight="700" textAnchor="middle">Account Hacked! Wipe All</text>
              <circle r="3.5" fill="#f43f5e"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#flow-hack-trigger" /></animateMotion></circle>

              {/* Gateway -> DB Wipes All Refresh Tokens */}
              <path id="flow-hack-db" d="M 480 125 L 590 75" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-blue)" contextFill="#f43f5e" />
              <text x="540" y="90" fill="#f43f5e" fontSize="8" textAnchor="middle">token_version++ & Wipe Tokens</text>

              {/* Gateway -> Redis Cache Push */}
              <path id="flow-hack-redis" d="M 480 145 L 590 195" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-blue)" contextFill="#f59e0b" />
              <text x="540" y="180" fill="#f59e0b" fontSize="8" textAnchor="middle">SET user:revoked_before = NOW()</text>
              <circle r="3.5" fill="#f59e0b"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#flow-hack-redis" /></animateMotion></circle>
            </>
          )}
        </svg>
      </div>

      {/* Description & Technical Summary Cards */}
      <div className="interactive-diagram-details-card" style={{ padding: '1rem', background: '#0b0f19' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ifm-color-content)' }}>
            {currentModeInfo.label} Overview
          </h4>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${currentModeInfo.badgeColor}22`,
              color: currentModeInfo.badgeColor,
              border: `1px solid ${currentModeInfo.badgeColor}44`
            }}
          >
            {currentModeInfo.badge}
          </span>
        </div>

        <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
          {currentModeInfo.description}
        </p>

        {/* Highlights breakdown grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {currentModeInfo.highlights.map((h, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: currentModeInfo.badgeColor, marginBottom: '4px' }}>
                {h.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                {h.details}
              </div>
              {h.codeSnippet && (
                <pre
                  style={{
                    margin: '8px 0 0 0',
                    padding: '6px 8px',
                    background: '#040711',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    color: '#e2e8f0',
                    overflowX: 'auto'
                  }}
                >
                  <code>{h.codeSnippet}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
