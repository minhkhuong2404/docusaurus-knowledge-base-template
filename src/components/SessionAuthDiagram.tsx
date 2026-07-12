import React, { useState } from 'react';

export default function SessionAuthDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: '1. POST /login',
      desc: 'User submits credentials (username/password) to the login endpoint.',
      detail: 'Request payload: { username: "alice", password: "password123" }'
    },
    {
      title: '2. Create Session',
      desc: 'Server validates credentials. Generates a random session ID and saves user info under this key in Redis/DB.',
      detail: 'Session Store: Key="abc123sessionid", Value={ userId: 998, roles: ["USER"] }'
    },
    {
      title: '3. Set-Cookie Header',
      desc: 'Server responds with a Set-Cookie header mapping the Session ID. Browser saves the cookie.',
      detail: 'HTTP Response Header: Set-Cookie: SESSION_ID=abc123sessionid; HttpOnly; Secure; SameSite=Lax'
    },
    {
      title: '4. Session Lookup',
      desc: 'On subsequent requests, the browser automatically attaches the cookie. The server fetches the session metadata from database.',
      detail: 'SQL query: SELECT * FROM sessions WHERE id = "abc123sessionid"'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🍪 Session-Based Authentication Flow
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="sess-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Nodes */}
          <g transform="translate(100, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Browser Client</text>
          </g>

          <g transform="translate(340, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a78bfa', textAnchor: 'middle' }}>App Server</text>
          </g>

          <g transform="translate(580, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
            <text x="0" y="5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#4ade80', textAnchor: 'middle' }}>Session Store (Redis)</text>
          </g>

          {/* Dynamic Step visual overlays */}
          {activeStep === 0 && (
            <path id="path-0" d="M 160 80 L 280 80" fill="none" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#sess-arr)" />
          )}
          {activeStep === 1 && (
            <path id="path-1" d="M 400 80 L 520 80" fill="none" stroke="#fb923c" strokeWidth="2.5" markerEnd="url(#sess-arr)" />
          )}
          {activeStep === 2 && (
            <path id="path-2" d="M 280 100 L 160 100" fill="none" stroke="#4ade80" strokeWidth="2.5" markerEnd="url(#sess-arr)" />
          )}
          {activeStep === 3 && (
            <>
              <path id="path-3-req" d="M 160 80 L 280 80" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#sess-arr)" />
              <path id="path-3-db" d="M 400 90 L 520 90" fill="none" stroke="#4ade80" strokeWidth="2" markerEnd="url(#sess-arr)" />
            </>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} disabled={activeStep === 0} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === 0 ? '#475569' : '#e2e8f0', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          ◀ Back
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
          Step {activeStep + 1} of {steps.length}
        </span>
        <button onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))} disabled={activeStep === steps.length - 1} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: activeStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Next Step ▶
        </button>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px', borderLeftColor: '#38bdf8' }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{steps[activeStep].title}</h4>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {steps[activeStep].desc}
        </p>
        <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {steps[activeStep].detail}
        </pre>
      </div>
    </div>
  );
}
