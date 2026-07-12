import React, { useState } from 'react';

export default function OidcFlowDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'flow' | 'tokens'>('flow');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🆔 OpenID Connect (OIDC) Flow & Identity Layer
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveTab('flow')} style={{ background: activeTab === 'flow' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'flow' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'flow' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Sequence Flow</button>
          <button onClick={() => setActiveTab('tokens')} style={{ background: activeTab === 'tokens' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'tokens' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'tokens' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Token Differences</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        {activeTab === 'flow' ? (
          <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
            <defs>
              <marker id="oidc-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Timelines */}
            <g transform="translate(80, 0)">
              <line x1="0" y1="30" x2="0" y2="160" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
              <rect x="-40" y="10" width="80" height="20" rx="3" fill="#090b14" stroke="#38bdf8" strokeWidth="1" />
              <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#38bdf8', fontWeight: 700, textAnchor: 'middle' }}>Client App</text>
            </g>

            <g transform="translate(340, 0)">
              <line x1="0" y1="30" x2="0" y2="160" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
              <rect x="-55" y="10" width="110" height="20" rx="3" fill="#090b14" stroke="#fb923c" strokeWidth="1" />
              <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#fb923c', fontWeight: 700, textAnchor: 'middle' }}>Identity Provider</text>
            </g>

            <g transform="translate(600, 0)">
              <line x1="0" y1="30" x2="0" y2="160" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
              <rect x="-50" y="10" width="100" height="20" rx="3" fill="#090b14" stroke="#4ade80" strokeWidth="1" />
              <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#4ade80', fontWeight: 700, textAnchor: 'middle' }}>Resource API</text>
            </g>

            {/* Steps */}
            <path d="M 80 60 L 340 60" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#oidc-arr)" />
            <text x="210" y="52" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#e2e8f0', textAnchor: 'middle' }}>1. Authorize & Authenticate (scope="openid profile")</text>

            <path d="M 340 90 L 80 90" fill="none" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#oidc-arr)" />
            <text x="210" y="82" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#fb923c', textAnchor: 'middle' }}>2. Returns: access_token + id_token</text>

            <path id="oidc-api-call" d="M 80 120 L 600 120" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#oidc-arr)" />
            <text x="340" y="112" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#4ade80', textAnchor: 'middle' }}>3. API Request: GET /userinfo (Authorization: Bearer access_token)</text>
            <circle r="3.2" fill="#4ade80">
              <animateMotion dur="1.5s" repeatCount="indefinite"><mpath href="#oidc-api-call" /></animateMotion>
            </circle>

            <path d="M 600 150 L 80 150" fill="none" stroke="#94a3b8" strokeWidth="1.2" markerEnd="url(#oidc-arr)" />
            <text x="340" y="142" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#94a3b8', textAnchor: 'middle' }}>4. Return User claims profile data</text>
          </svg>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#38bdf8' }}>Access Token (OAuth 2.0)</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.74rem', color: '#94a3b8' }}>Designed for machines and downstream resource consumption.</p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                <li>Used to authorize API calls.</li>
                <li>Opaque string or JWT without user profiles.</li>
                <li>Sent to the resource server.</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#a78bfa' }}>ID Token (OIDC Extension)</h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.74rem', color: '#94a3b8' }}>Designed for the client application to know who logged in.</p>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                <li>Always a structured JWT.</li>
                <li>Contains identity claims: name, email, avatar, etc.</li>
                <li>Used to bootstrap local client UI contexts.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong>OpenID Connect (OIDC)</strong> is a simple identity layer built on top of the OAuth 2.0 framework. It enables clients to verify the identity of the End-User based on the authentication performed by an Authorization Server, as well as to obtain basic profile information about the End-User in a interoperable and REST-like manner.
        </p>
      </div>
    </div>
  );
}
