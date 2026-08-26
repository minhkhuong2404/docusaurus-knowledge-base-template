import React, { useState } from 'react';

export default function AccountLockedLifecycleDiagram(): React.JSX.Element {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [testedEndpoint, setTestedEndpoint] = useState<string>('/api/v1/orders');
  const [lastResponse, setLastResponse] = useState<{ status: number; message: string; latency: string } | null>(null);

  const simulateApiCall = (endpoint: string) => {
    setTestedEndpoint(endpoint);
    if (isLocked) {
      setLastResponse({
        status: 403,
        message: 'HTTP 403 Forbidden: {"error": "ACCOUNT_LOCKED", "message": "Account suspended by security. Contact support."}',
        latency: '0.42 ms (Redis Interception)'
      });
    } else {
      setLastResponse({
        status: 200,
        message: 'HTTP 200 OK: {"data": [{"id": "ord_101", "total": 149.99}], "status": "success"}',
        latency: '18.5 ms (Microservice Execution)'
      });
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .lock-grid {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .lock-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Account Locked / Suspended Zero-Latency Containment Engine
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 600 }}>
          Interactive Simulator
        </span>
      </div>

      {/* Main Body */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
          Simulate how the API Gateway uses distributed <strong>Redis fast-path flags</strong> to instantly reject requests from all devices the millisecond an account is locked:
        </div>

        <div className="lock-grid">
          {/* Left Column: Account Lock Control & Flow */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
                Target Account: usr_404
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: isLocked ? '#f8717120' : '#34d39920', color: isLocked ? '#f87171' : '#34d399' }}>
                STATUS: {isLocked ? 'LOCKED 🔒' : 'ACTIVE ✅'}
              </span>
            </div>

            {/* Toggle Button */}
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => {
                  const nextState = !isLocked;
                  setIsLocked(nextState);
                  setLastResponse(null);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: `2px solid ${isLocked ? '#34d399' : '#f87171'}`,
                  background: isLocked ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                  color: isLocked ? '#34d399' : '#f87171',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {isLocked ? '🔓 UNLOCK ACCOUNT (Restore Normal Access)' : '🔒 LOCK ACCOUNT (Trigger Emergency Freeze)'}
              </button>
            </div>

            {/* Database & Redis State */}
            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px', fontFamily: 'monospace' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>CURRENT SYSTEM STATE:</div>
              <div>• PostgreSQL: <code>users.status = &apos;{isLocked ? 'LOCKED' : 'ACTIVE'}&apos;</code></div>
              <div>• Redis Key: <code>user:locked:usr_404 ➔ {isLocked ? '1 (TTL 86400s)' : 'NULL'}</code></div>
              <div>• Active JWTs: <code>{isLocked ? 'Still held by devices, but intercepted!' : 'Valid'}</code></div>
            </div>
          </div>

          {/* Right Column: Live API Request Tester */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#fbbf24' }}>
              Test API Gateway Interception
            </h4>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
              Select an endpoint to fire an API request carrying a valid, signed JWT access token:
            </div>

            {/* Endpoint buttons */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {['/api/v1/orders', '/api/v1/payments/transfer', '/api/v1/user/profile'].map((ep) => (
                <button
                  key={ep}
                  onClick={() => simulateApiCall(ep)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: `1px solid ${testedEndpoint === ep ? '#38bdf8' : 'var(--ifm-color-emphasis-300)'}`,
                    background: testedEndpoint === ep ? 'rgba(56, 189, 248, 0.15)' : 'var(--ifm-color-emphasis-100)',
                    color: testedEndpoint === ep ? '#38bdf8' : 'var(--ifm-color-content)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    cursor: 'pointer'
                  }}
                >
                  GET {ep}
                </button>
              ))}
            </div>

            {/* Response Output Box */}
            {lastResponse ? (
              <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderLeft: `4px solid ${lastResponse.status === 200 ? '#34d399' : '#f87171'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: lastResponse.status === 200 ? '#34d399' : '#f87171' }}>
                    STATUS: {lastResponse.status}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>
                    Latency: {lastResponse.latency}
                  </span>
                </div>
                <pre style={{ margin: 0, padding: '6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px', fontSize: '11px', overflowX: 'auto' }}>
                  <code>{lastResponse.message}</code>
                </pre>
              </div>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '11px', background: 'var(--ifm-color-emphasis-100)', borderRadius: '4px' }}>
                Click one of the endpoints above to test live request interception.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
