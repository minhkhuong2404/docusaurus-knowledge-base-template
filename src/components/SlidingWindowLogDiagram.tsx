import React, { useState } from 'react';

export default function SlidingWindowLogDiagram() {
  const limit = 4;
  const [logs, setLogs] = useState<string[]>(['10:00:02', '10:00:15', '10:00:44']);
  const [status, setStatus] = useState<string>('Log initialized with 3 timestamps. Window size: 60s.');

  const handleAddRequest = () => {
    if (logs.length < limit) {
      setLogs(prev => [...prev, '10:01:00']);
      setStatus('✅ Timestamp 10:01:00 logged into ZSET. Total count: 4/4 (Approved).');
    } else {
      setStatus('🚨 ZSET size exceeds limit (4)! Request rejected and timestamp removed.');
    }
  };

  const handleCleanup = () => {
    setLogs(prev => prev.filter(t => !t.startsWith('10:00:02')));
    setStatus('🧹 Range cleanup: ZREMRANGEBYSCORE removed timestamps older than (now - 60s).');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>Sliding Window Log (Redis ZSET Timeline Simulator)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="log-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .log-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* ZSET Log Box */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
            <strong style={{ color: '#fbbf24' }}>Redis ZSET Log (Max {limit}):</strong>
            <span style={{ color: logs.length < limit ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{logs.length} Logged</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {logs.map((ts, idx) => (
              <span key={idx} style={{
                padding: '4px 8px', borderRadius: '4px', background: '#fbbf2420', color: '#fbbf24',
                fontSize: '11px', fontWeight: 'bold', border: '1px solid #fbbf2440'
              }}>
                {ts}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button onClick={handleAddRequest} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#fbbf24',
              color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Add Request (10:01:00)</button>

            <button onClick={handleCleanup} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.06)',
              color: '#34d399', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Cleanup Expired</button>
          </div>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#fbbf2440' }}>
          <h4 style={{ color: '#fbbf24', margin: '0 0 4px 0', fontSize: '13px' }}>Log Execution State</h4>
          <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
