import React, { useState } from 'react';

export default function TokenBucketDiagram() {
  const capacity = 10;
  const [tokens, setTokens] = useState<number>(10);
  const [log, setLog] = useState<string>('System initialized with 10/10 tokens.');

  const handleRequest = () => {
    if (tokens >= 1) {
      setTokens(prev => prev - 1);
      setLog('✅ Request approved! Consumed 1 token.');
    } else {
      setLog('🚨 Request REJECTED (HTTP 429 Too Many Requests)! No tokens available.');
    }
  };

  const handleBurst = () => {
    if (tokens >= 5) {
      setTokens(prev => prev - 5);
      setLog('🚀 Burst of 5 requests APPROVED! Consumed 5 tokens.');
    } else {
      setLog(`⚠️ Burst of 5 requests failed! Only ${tokens} tokens available.`);
    }
  };

  const handleRefill = () => {
    setTokens(prev => Math.min(capacity, prev + 2));
    setLog('⏳ Lazy Refill triggered: Added +2 tokens (refill rate r=2/sec).');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <span>Token Bucket Algorithm Simulator (Capacity C = 10)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="token-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .token-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Bucket Visualization */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
            <strong style={{ color: '#38bdf8' }}>Bucket Level:</strong>
            <span style={{ color: tokens > 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{tokens} / {capacity} Tokens</span>
          </div>

          <div style={{ height: '24px', width: '100%', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{
              height: '100%', width: `${(tokens / capacity) * 100}%`,
              background: tokens > 3 ? 'linear-gradient(90deg, #38bdf8, #34d399)' : '#f87171',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button onClick={handleRequest} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#38bdf8',
              color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Send 1 Request</button>

            <button onClick={handleBurst} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#a78bfa',
              color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Simulate 5 Burst</button>

            <button onClick={handleRefill} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.06)',
              color: '#34d399', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Refill +2</button>
          </div>
        </div>

        {/* Info & Log Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
          <h4 style={{ color: '#38bdf8', margin: '0 0 4px 0', fontSize: '13px' }}>Token Bucket State</h4>
          <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
            {log}
          </p>
        </div>
      </div>
    </div>
  );
}
