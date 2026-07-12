import React, { useState } from 'react';

type Mode = 'airport' | 'technical';

export default function AuthNvsAuthZDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('airport');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            🔐 Authentication vs. Authorization — Core Concept
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('airport')} style={{ background: mode === 'airport' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'airport' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'airport' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            Airport Analogy ✈️
          </button>
          <button onClick={() => setMode('technical')} style={{ background: mode === 'technical' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'technical' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'technical' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            Technical Workflow 💻
          </button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 220" className="interactive-diagram-svg">
          <defs>
            <marker id="auth-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {mode === 'airport' ? (
            // Airport Analogy
            <>
              {/* Step 1: Authentication */}
              <g transform="translate(40, 30)">
                <rect x="0" y="0" width="260" height="150" rx="8" fill="rgba(56,189,248,0.04)" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="15" y="-12" width="130" height="24" rx="4" fill="#0d1527" stroke="#38bdf8" strokeWidth="1" />
                <text x="80" y="4" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>1. Authentication (AuthN)</text>
                
                {/* Visual of Passport */}
                <rect x="25" y="30" width="70" height="100" rx="5" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="60" cy="65" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 48 95 C 48 80, 72 80, 72 95 Z" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="60" y="118" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#38bdf8', textAnchor: 'middle' }}>PASSPORT</text>

                {/* Explanation text inside */}
                <text x="110" y="55" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#e2e8f0' }}>"Who are you?"</text>
                <text x="110" y="75" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8' }}>• Shows passport to officer</text>
                <text x="110" y="93" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8' }}>• Proves identity matches</text>
                <text x="110" y="111" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8' }}>• Returns: Identity Verified</text>
              </g>

              {/* Arrow linking step 1 to 2 */}
              <path d="M 310 105 L 370 105" fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#auth-arr)" />

              {/* Step 2: Authorization */}
              <g transform="translate(380, 30)">
                <rect x="0" y="0" width="260" height="150" rx="8" fill="rgba(167,139,250,0.04)" stroke="#a78bfa" strokeWidth="1.5" />
                <rect x="15" y="-12" width="130" height="24" rx="4" fill="#130d25" stroke="#a78bfa" strokeWidth="1" />
                <text x="80" y="4" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a78bfa', textAnchor: 'middle' }}>2. Authorization (AuthZ)</text>

                {/* Visual of Boarding pass */}
                <rect x="25" y="40" width="90" height="80" rx="4" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <line x1="35" y1="60" x2="105" y2="60" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3,2" />
                <line x1="35" y1="80" x2="105" y2="80" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="70" y="105" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 7.5, fill: '#a78bfa', textAnchor: 'middle', letterSpacing: 1.5 }}>BOARDING PASS</text>

                {/* Explanation text inside */}
                <text x="130" y="55" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#e2e8f0' }}>"What can you do?"</text>
                <text x="130" y="75" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8' }}>• Checks flight ticket</text>
                <text x="130" y="93" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8' }}>• Confirms access level</text>
                <text x="130" y="111" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#94a3b8' }}>• Denies First Class if coach</text>
              </g>
            </>
          ) : (
            // Technical Workflow
            <>
              {/* AuthN box */}
              <g transform="translate(40, 30)">
                <rect x="0" y="0" width="260" height="150" rx="8" fill="rgba(56,189,248,0.04)" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="15" y="-12" width="130" height="24" rx="4" fill="#0d1527" stroke="#38bdf8" strokeWidth="1" />
                <text x="80" y="4" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Authentication (AuthN)</text>
                
                <text x="20" y="38" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#e2e8f0' }}>Verifies Client Credentials</text>
                <text x="20" y="56" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#94a3b8' }}>• Username/Password, Passkeys, biometrics</text>
                <text x="20" y="72" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#94a3b8' }}>• Generates session record or signed JWT</text>
                <text x="20" y="88" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#94a3b8' }}>• Returns user identifier (e.g. subject claims)</text>

                <rect x="15" y="105" width="230" height="30" rx="4" fill="rgba(248,113,113,0.08)" stroke="#f87171" strokeWidth="1" />
                <text x="130" y="123" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#f87171', textAnchor: 'middle' }}>Fail Code: 401 Unauthorized (Identity Missing)</text>
              </g>

              {/* Arrow */}
              <path d="M 310 105 L 370 105" fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#auth-arr)" />

              {/* AuthZ box */}
              <g transform="translate(380, 30)">
                <rect x="0" y="0" width="260" height="150" rx="8" fill="rgba(167,139,250,0.04)" stroke="#a78bfa" strokeWidth="1.5" />
                <rect x="15" y="-12" width="130" height="24" rx="4" fill="#130d25" stroke="#a78bfa" strokeWidth="1" />
                <text x="80" y="4" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a78bfa', textAnchor: 'middle' }}>Authorization (AuthZ)</text>
                
                <text x="20" y="38" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#e2e8f0' }}>Evaluates System Permissions</text>
                <text x="20" y="56" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#94a3b8' }}>• Roles, scopes, access control policy lists</text>
                <text x="20" y="72" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#94a3b8' }}>• Enforces database & resource guards</text>
                <text x="20" y="88" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#94a3b8' }}>• Intercepts calls via Security Interceptor</text>

                <rect x="15" y="105" width="230" height="30" rx="4" fill="rgba(248,113,113,0.08)" stroke="#f87171" strokeWidth="1" />
                <text x="130" y="123" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#f87171', textAnchor: 'middle' }}>Fail Code: 403 Forbidden (Blocked / Insufficient)</text>
              </g>
            </>
          )}
        </svg>
      </div>
      <p className="interactive-diagram-helper-text">💡 Use the buttons at the top to toggle between the real-world Airport Analogy and the technical implementation specifications.</p>
    </div>
  );
}
