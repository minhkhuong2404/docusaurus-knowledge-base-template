import React, { useState } from 'react';

type CorsMode = 'simple' | 'preflight';

export default function CorsDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<CorsMode>('simple');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🌐 CORS & Preflight Requests Flow
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('simple')} style={{ background: mode === 'simple' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'simple' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'simple' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Simple Request</button>
          <button onClick={() => setMode('preflight')} style={{ background: mode === 'preflight' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'preflight' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: mode === 'preflight' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Preflight OPTIONS</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="cors-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Timelines */}
          <g transform="translate(100, 0)">
            <line x1="0" y1="30" x2="0" y2="180" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
            <rect x="-50" y="10" width="100" height="20" rx="3" fill="#090b14" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#38bdf8', fontWeight: 700, textAnchor: 'middle' }}>Browser Client</text>
          </g>

          <g transform="translate(580, 0)">
            <line x1="0" y1="30" x2="0" y2="180" stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
            <rect x="-50" y="10" width="100" height="20" rx="3" fill="#090b14" stroke="#a78bfa" strokeWidth="1" />
            <text x="0" y="22" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#a78bfa', fontWeight: 700, textAnchor: 'middle' }}>API Server</text>
          </g>

          {mode === 'simple' ? (
            <>
              {/* Simple Flow */}
              <path id="simple-req" d="M 100 65 L 580 65" fill="none" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#cors-arr)" />
              <text x="340" y="56" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#e2e8f0', textAnchor: 'middle' }}>GET /data (Origin: https://app.example.com)</text>
              <circle r="3" fill="#38bdf8"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#simple-req" /></animateMotion></circle>

              <path id="simple-res" d="M 580 120 L 100 120" fill="none" stroke="#4ade80" strokeWidth="1.8" markerEnd="url(#cors-arr)" />
              <text x="340" y="112" style={{ fontFamily: 'Inter', fontSize: 7.8, fill: '#4ade80', textAnchor: 'middle' }}>200 OK (Access-Control-Allow-Origin: https://app.example.com)</text>
            </>
          ) : (
            <>
              {/* Preflight OPTIONS Flow */}
              <path id="preflight-options-req" d="M 100 50 L 580 50" fill="none" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#cors-arr)" />
              <text x="340" y="42" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#fb923c', textAnchor: 'middle' }}>OPTIONS /data (Access-Control-Request-Method: DELETE)</text>

              <path id="preflight-options-res" d="M 580 90 L 100 90" fill="none" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#cors-arr)" />
              <text x="340" y="82" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#a78bfa', textAnchor: 'middle' }}>200 OK (Access-Control-Allow-Methods: GET, POST, DELETE)</text>

              <path id="preflight-actual-req" d="M 100 130 L 580 130" fill="none" stroke="#38bdf8" strokeWidth="1.8" markerEnd="url(#cors-arr)" />
              <text x="340" y="122" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#e2e8f0', textAnchor: 'middle' }}>DELETE /data</text>
              <circle r="3" fill="#38bdf8"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#preflight-actual-req" /></animateMotion></circle>

              <path d="M 580 165 L 100 165" fill="none" stroke="#4ade80" strokeWidth="1.2" markerEnd="url(#cors-arr)" />
              <text x="340" y="157" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>200 OK (Deleted successfully)</text>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {mode === 'simple' ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Simple Request Flow</strong> — Triggered for standard GET or POST requests with basic Content-Types (e.g. <code>application/x-www-form-urlencoded</code>) and no custom headers. The browser sends the request directly, attaching the <code>Origin</code> header, and only blocks the response if the server does not return matching <code>Access-Control-Allow-Origin</code> values.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Preflight Request Flow</strong> — Required for requests that could modify server data (DELETE, PUT) or requests with custom headers (like <code>Authorization</code>) or content types like <code>application/json</code>. The browser automatically sends an HTTP <code>OPTIONS</code> request first to query server permissions. Only if the preflight check succeeds does the browser fire the actual request.
          </p>
        )}
      </div>
    </div>
  );
}
