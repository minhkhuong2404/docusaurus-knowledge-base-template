import React, { useState } from 'react';

export default function RateLimitingTokenBucketDiagram() {
  const [tokens, setTokens] = useState<number>(10);
  const [lastStatus, setLastStatus] = useState<string>('Ready');

  const maxCapacity = 10;

  const handleSend = () => {
    if (tokens > 0) {
      setTokens(t => t - 1);
      setLastStatus('🟢 200 OK (1 token consumed)');
    } else {
      setLastStatus('🚨 429 Too Many Requests (Bucket empty!)');
    }
  };

  const handleRefill = () => {
    setTokens(Math.min(maxCapacity, tokens + 3));
    setLastStatus('🔄 Refilled +3 tokens');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Token Bucket Rate Limiter Simulator</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="token-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .token-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Visual Bucket */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>
            TOKEN BUCKET CAPACITY ({tokens} / {maxCapacity} TOKENS)
          </div>

          <div style={{
            height: '140px', width: '100px', margin: '0 auto', border: '2px solid #fbbf24',
            borderRadius: '0 0 12px 12px', position: 'relative', background: 'rgba(255,255,255,0.02)',
            display: 'flex', flexDirection: 'column-reverse', padding: '6px', gap: '4px', overflow: 'hidden'
          }}>
            {Array.from({ length: tokens }).map((_, i) => (
              <div key={i} style={{
                height: '10px', background: '#fbbf24', borderRadius: '3px',
                boxShadow: '0 0 4px #fbbf2480', transition: 'all 0.2s ease'
              }} />
            ))}
          </div>
        </div>

        {/* Controls Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#fbbf2440' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: '#fbbf24' }}>Bucket Controls</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
            <button onClick={handleSend} style={{
              padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#fbbf24',
              color: '#090b14', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
            }}>
              ⚡ Send API Request
            </button>

            <button onClick={handleRefill} style={{
              padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
            }}>
              🔄 Refill Tokens
            </button>
          </div>

          <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
            <strong>Latest Outcome:</strong>
            <div style={{ color: tokens === 0 && lastStatus.includes('429') ? '#f87171' : '#34d399', fontWeight: 'bold', marginTop: '4px' }}>
              {lastStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
