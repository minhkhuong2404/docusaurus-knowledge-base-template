import React, { useState } from 'react';

export default function CorsProtocolDiagram(): React.JSX.Element {
  const [requestType, setRequestType] = useState<'simple' | 'preflight'>('preflight');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          CORS Protocol &amp; Preflight Request Protocol Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setRequestType('simple')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: requestType === 'simple' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: requestType === 'simple' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Simple Request (`GET / POST text/plain`)
          </button>
          <button onClick={() => setRequestType('preflight')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: requestType === 'preflight' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: requestType === 'preflight' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Preflighted Request (`OPTIONS` + Custom Headers)
          </button>
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
          <code>
            {requestType === 'simple'
              ? `GET /api/data HTTP/1.1\nHost: api.example.com\nOrigin: https://app.example.com\n\nHTTP/1.1 200 OK\nAccess-Control-Allow-Origin: https://app.example.com`
              : `OPTIONS /api/v2/orders HTTP/1.1\nHost: api.example.com\nOrigin: https://app.example.com\nAccess-Control-Request-Method: DELETE\nAccess-Control-Request-Headers: Authorization, Content-Type\n\nHTTP/1.1 204 No Content\nAccess-Control-Allow-Origin: https://app.example.com\nAccess-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\nAccess-Control-Allow-Headers: Authorization, Content-Type\nAccess-Control-Max-Age: 86400`}
          </code>
        </pre>
      </div>
    </div>
  );
}
