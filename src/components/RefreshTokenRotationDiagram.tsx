import React, { useState } from 'react';

type FlowMode = 'normal' | 'theft';

export default function RefreshTokenRotationDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<FlowMode>('normal');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 Refresh Token Rotation & Theft Detection
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('normal')} style={{ background: mode === 'normal' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'normal' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'normal' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Normal Rotation ✅</button>
          <button onClick={() => setMode('theft')} style={{ background: mode === 'theft' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'theft' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'theft' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Theft Detection 🚨</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="rtr-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Timelines */}
          <g transform="translate(100, 0)">
            <line x1="0" y1="30" x2="0" y2="185" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
            <rect x="-50" y="10" width="100" height="20" rx="3" fill="#090b14" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#38bdf8', fontWeight: 700, textAnchor: 'middle' }}>Client Browser</text>
          </g>

          <g transform="translate(580, 0)">
            <line x1="0" y1="30" x2="0" y2="185" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
            <rect x="-50" y="10" width="100" height="20" rx="3" fill="#090b14" stroke="#a78bfa" strokeWidth="1" />
            <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#a78bfa', fontWeight: 700, textAnchor: 'middle' }}>Auth Server</text>
          </g>

          {mode === 'normal' ? (
            <>
              {/* Normal Success Flow */}
              <path id="rtr-norm1" d="M 100 65 L 580 65" fill="none" stroke="#fb923c" strokeWidth="1.8" markerEnd="url(#rtr-arr)" />
              <text x="340" y="56" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#fb923c', textAnchor: 'middle' }}>1. POST /refresh (send RefreshToken v1)</text>
              <circle r="3" fill="#fb923c"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#rtr-norm1" /></animateMotion></circle>

              <path id="rtr-norm2" d="M 580 120 L 100 120" fill="none" stroke="#4ade80" strokeWidth="1.8" markerEnd="url(#rtr-arr)" />
              <text x="340" y="112" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#4ade80', textAnchor: 'middle' }}>2. Returns AccessToken v2 + RefreshToken v2 (Rotated)</text>

              <rect x="520" y="145" width="120" height="30" rx="4" fill="rgba(74,222,128,0.12)" stroke="#4ade80" strokeWidth="1" />
              <text x="580" y="163" style={{ fontFamily: 'Inter', fontSize: 7.2, fill: '#4ade80', fontWeight: 700, textAnchor: 'middle' }}>Mark v1 as USED</text>
            </>
          ) : (
            <>
              {/* Replay attack flow */}
              <path id="rtr-theft1" d="M 100 65 L 580 65" fill="none" stroke="#f87171" strokeWidth="1.8" markerEnd="url(#rtr-arr)" />
              <text x="340" y="56" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#f87171', textAnchor: 'middle' }}>1. Malicious Actor replays USED RefreshToken v1</text>
              <circle r="3" fill="#f87171"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#rtr-theft1" /></animateMotion></circle>

              <path d="M 580 120 L 100 120" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#rtr-arr)" />
              <text x="340" y="112" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#f87171', textAnchor: 'middle' }}>2. REJECTED: Reuse detected!</text>

              <rect x="500" y="138" width="160" height="36" rx="4" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1" />
              <text x="580" y="150" style={{ fontFamily: 'Inter', fontSize: 7.2, fill: '#f87171', fontWeight: 800, textAnchor: 'middle' }}>REVOKE TOKEN FAMILY</text>
              <text x="580" y="162" style={{ fontFamily: 'Inter', fontSize: 6.8, fill: '#e2e8f0', textAnchor: 'middle' }}>(force re-login for all nodes)</text>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {mode === 'normal' ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Normal Flow:</strong> On each token refresh, the authorization server marks the client's current refresh token as <code>used</code>, and returns a new <code>access_token</code> alongside a brand new <code>refresh_token</code> (the rotation).
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Theft Attempt Flow:</strong> If a compromised refresh token is replayed by an attacker, the authorization server instantly flags that the key has already been marked as used. The server triggers protection protocols, revoking the entire token family (meaning the user's active session is terminated, forcing a re-login).
          </p>
        )}
      </div>
    </div>
  );
}
