import React from 'react';

export default function CookieSessionStateDiagram(): React.JSX.Element {
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🍪 Cookie + Session: Server-Side State Layout
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Client side (Opaque) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Client Side (Opaque Value)</h4>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#e2e8f0', marginBottom: '8px' }}>
            JSESSIONID=sess_9983a1b4
          </div>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            The browser only stores a cryptographically random, opaque string. No user details, roles, or attributes leave the server or exist inside the client's cookie value.
          </p>
        </div>

        {/* Server side (Stateful) */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#a78bfa' }}>Server Side (Redis/DB Memory)</h4>
          <pre style={{ margin: '0 0 8px 0', padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#a78bfa', overflowX: 'auto' }}>
{`Key: "sess_9983a1b4"
Value: {
  "userId": "usr_77",
  "username": "bob",
  "roles": ["USER", "EDITOR"],
  "expiresAt": "2026-07-12T13:13:00"
}`}
          </pre>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            The application must query the Redis cluster or SQL database on every single request to look up the session details and populate the SecurityContext.
          </p>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          💡 <strong>Revocability Benefit:</strong> To log the user out instantly or terminate their session due to compromise, the server simply deletes the session key from Redis, immediately rendering the client ID cookie orphan and invalid.
        </p>
      </div>
    </div>
  );
}
