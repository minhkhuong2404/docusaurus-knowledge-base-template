import React, { useState } from 'react';

interface ErrorItem {
  code: string;
  name: string;
  transient: boolean;
  action: string;
  reason: string;
  bestPractice: string;
}

const TRANSIENT_ERRORS: ErrorItem[] = [
  { code: 'HTTP 408', name: 'Request Timeout', transient: true, action: 'Retry with Backoff', reason: 'The server timed out waiting for the request. Network delays or high server load may clear quickly.', bestPractice: 'Retry up to 3 times with exponential backoff.' },
  { code: 'HTTP 429', name: 'Too Many Requests', transient: true, action: 'Honor Retry-After', reason: 'Downstream rate limit hit. High load or bucket depletion.', bestPractice: 'Always inspect and honor the Retry-After response header before retrying.' },
  { code: 'HTTP 502', name: 'Bad Gateway', transient: true, action: 'Retry with Jitter', reason: 'Upstream proxy received an invalid response or brief drop from application pod.', bestPractice: 'Use full randomized jitter to prevent thundering herd on upstream reboot.' },
  { code: 'HTTP 503', name: 'Service Unavailable', transient: true, action: 'Retry with Backoff', reason: 'Server is currently unable to handle the request due to temporary overload or maintenance.', bestPractice: 'Combine retry with a circuit breaker if 503s persist.' },
  { code: 'HTTP 504', name: 'Gateway Timeout', transient: true, action: 'Retry (Idempotent Only)', reason: 'Upstream server failed to respond in time.', bestPractice: 'Only retry if operation is idempotent (or includes an Idempotency-Key).' },
  { code: 'ConnectException', name: 'Connection Refused', transient: true, action: 'Retry with Backoff', reason: 'Network path dropped or target pod is restarting.', bestPractice: 'Retry immediately or with short initial delay (100ms).' },
  { code: 'SocketTimeoutException', name: 'Read Timeout', transient: true, action: 'Retry (Idempotent Only)', reason: 'Packet dropped in transit or application thread pool starved.', bestPractice: 'Ensure connection and read timeouts are explicitly set on HTTP client.' },
];

const PERSISTENT_ERRORS: ErrorItem[] = [
  { code: 'HTTP 400', name: 'Bad Request', transient: false, action: 'Fail Fast (No Retry)', reason: 'Malformed syntax, invalid JSON, or missing required fields.', bestPractice: 'Fail immediately. Return error to client; client payload must be corrected.' },
  { code: 'HTTP 401', name: 'Unauthorized', transient: false, action: 'Fail Fast (No Retry)', reason: 'Authentication missing or token expired.', bestPractice: 'Refresh OAuth token or re-authenticate before attempting a new request.' },
  { code: 'HTTP 403', name: 'Forbidden', transient: false, action: 'Fail Fast (No Retry)', reason: 'Authenticated user lacks required RBAC permissions.', bestPractice: 'Do not retry; permission checks will never change without admin grant.' },
  { code: 'HTTP 404', name: 'Not Found', transient: false, action: 'Fail Fast (No Retry)', reason: 'Target URI or resource ID does not exist in backend database.', bestPractice: 'Fail immediately; retrying a missing URI wastes network bandwidth.' },
  { code: 'NullPointerException', name: 'NPE / Code Bug', transient: false, action: 'Fail Fast (No Retry)', reason: 'Software bug inside application logic.', bestPractice: 'Do not catch Exception.class. Code bugs will fail identically on every retry.' },
  { code: 'ConstraintViolation', name: 'Validation Error', transient: false, action: 'Fail Fast (No Retry)', reason: 'Field failed domain validation rule (e.g. age < 0).', bestPractice: 'Reject immediately at API boundary.' },
];

export default function TransientErrorClassifierDiagram() {
  const [activeTab, setActiveTab] = useState<'transient' | 'persistent'>('transient');
  const [selectedError, setSelectedError] = useState<ErrorItem>(TRANSIENT_ERRORS[0]);

  const list = activeTab === 'transient' ? TRANSIENT_ERRORS : PERSISTENT_ERRORS;

  const handleTabChange = (tab: 'transient' | 'persistent') => {
    setActiveTab(tab);
    setSelectedError(tab === 'transient' ? TRANSIENT_ERRORS[0] : PERSISTENT_ERRORS[0]);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Error Classifier — Transient vs. Persistent</span>

        {/* Tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => handleTabChange('transient')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'transient' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'transient' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'transient' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Transient (Retry ✅)
          </button>
          <button onClick={() => handleTabChange('persistent')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'persistent' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'persistent' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'persistent' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Persistent (Fail Fast ❌)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="classifier-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .classifier-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Error List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
          {list.map(err => {
            const isSelected = selectedError.code === err.code;
            const themeColor = err.transient ? '#34d399' : '#f87171';
            return (
              <button key={err.code} onClick={() => setSelectedError(err)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                textAlign: 'left',
                background: isSelected ? `${themeColor}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${themeColor}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{
                    fontSize: '11px', fontWeight: 700, color: themeColor,
                    background: `${themeColor}15`, padding: '2px 6px', borderRadius: '4px'
                  }}>
                    {err.code}
                  </code>
                  <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '600' }}>
                    {err.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: selectedError.transient ? '#34d39940' : '#f8717140' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: selectedError.transient ? '#34d399' : '#f87171' }}>
              {selectedError.code} — {selectedError.name}
            </h3>
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{
              fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px',
              color: selectedError.transient ? '#34d399' : '#f87171',
              background: selectedError.transient ? '#34d39918' : '#f8717118',
              border: `1px solid ${selectedError.transient ? '#34d39940' : '#f8717140'}`
            }}>
              ACTION: {selectedError.action}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '10px' }}>
            <strong>Why it occurs:</strong> {selectedError.reason}
          </p>

          <div style={{
            fontSize: '12px', background: 'rgba(255,255,255,0.02)',
            padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '12px'
          }}>
            <strong style={{ color: selectedError.transient ? '#34d399' : '#f87171' }}>Best Practice Recommendation:</strong>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0' }}>
              {selectedError.bestPractice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
