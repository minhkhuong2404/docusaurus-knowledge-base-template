import React, { useState } from 'react';

type CsrfTab = 'attack' | 'mitigation';

export default function CsrfDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CsrfTab>('attack');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ CSRF Attack vs. Token Mitigation Flow
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveTab('attack')} style={{ background: activeTab === 'attack' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'attack' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'attack' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1. The Attack Scenario 😈</button>
          <button onClick={() => setActiveTab('mitigation')} style={{ background: activeTab === 'mitigation' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'mitigation' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'mitigation' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>2. Anti-CSRF Token Shield 🛡️</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="csrf-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" />
            </marker>
            <marker id="csrf-arr-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" />
            </marker>
          </defs>

          {/* Actor Nodes */}
          <g transform="translate(70, 100)">
            <rect x="-50" y="-35" width="100" height="70" rx="5" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="0" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Victim's</text>
            <text x="0" y="12" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Browser</text>
          </g>

          <g transform="translate(340, 100)">
            <rect x="-60" y="-35" width="120" height="70" rx="5" fill="#1c1116" stroke="#f87171" strokeWidth="1.5" />
            <text x="0" y="0" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#f87171', textAnchor: 'middle' }}>Malicious Site</text>
            <text x="0" y="12" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#fda4af', textAnchor: 'middle' }}>evil-hacker.com</text>
          </g>

          <g transform="translate(600, 100)">
            <rect x="-50" y="-35" width="100" height="70" rx="5" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
            <text x="0" y="0" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#4ade80', textAnchor: 'middle' }}>Target Bank</text>
            <text x="0" y="12" style={{ fontFamily: 'Inter', fontSize: 8.2, fill: '#86efac', textAnchor: 'middle' }}>bank.com</text>
          </g>

          {activeTab === 'attack' ? (
            <>
              {/* Attack Arrows */}
              <path id="csrf-req1" d="M 120 75 L 280 75" fill="none" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#csrf-arr)" />
              <text x="200" y="65" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#f87171', textAnchor: 'middle' }}>1. Visit evil site</text>

              <path id="csrf-req2" d="M 280 120 L 120 120" fill="none" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#csrf-arr)" />
              <text x="200" y="138" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#f87171', textAnchor: 'middle' }}>2. Loads hidden form</text>

              <path id="csrf-req3" d="M 120 100 C 220 170, 480 170, 550 120" fill="none" stroke="#f87171" strokeWidth="2.5" markerEnd="url(#csrf-arr)" />
              <text x="345" y="180" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#f87171', textAnchor: 'middle' }}>3. Auto-posts form to bank.com (browser appends JSESSIONID cookie!)</text>
              <circle r="3.2" fill="#f87171">
                <animateMotion dur="1.5s" repeatCount="indefinite"><mpath href="#csrf-req3" /></animateMotion>
              </circle>
            </>
          ) : (
            <>
              {/* Mitigation Flow */}
              <path d="M 120 100 C 220 170, 480 170, 550 120" fill="none" stroke="#4ade80" strokeWidth="2" markerEnd="url(#csrf-arr-green)" />
              <text x="345" y="157" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#4ade80', textAnchor: 'middle' }}>Auto-post blocked: form does not contain matching anti-CSRF token!</text>

              <rect x="520" y="20" width="130" height="36" rx="4" fill="rgba(74,222,128,0.12)" stroke="#4ade80" strokeWidth="1" />
              <text x="585" y="32" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#4ade80', fontWeight: 700, textAnchor: 'middle' }}>Required token check:</text>
              <text x="585" y="44" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#e2e8f0', textAnchor: 'middle' }}>Header: X-CSRF-TOKEN</text>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {activeTab === 'attack' ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            ⚠️ <strong>CSRF Attack Flow</strong> — If Alice is logged into her bank with a session cookie and visits a malicious site, the malicious site runs a script to auto-submit a hidden form to the bank. Because the bank request targets the bank domain, the browser automatically attaches Alice's session cookie, causing the bank to authorize the transfer.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            🛡️ <strong>Anti-CSRF Mitigation Shield</strong> — When enabled, the server injects a cryptographically random token (CSRF token) into all valid pages. Client forms must read and attach this token as a custom header or hidden field. Because a malicious website cannot read this token from another domain, their POST requests fail server verification checks.
          </p>
        )}
      </div>
    </div>
  );
}
