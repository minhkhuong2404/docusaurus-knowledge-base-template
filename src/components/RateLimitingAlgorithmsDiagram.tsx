import React, { useState } from 'react';

interface Algorithm {
  id: string;
  name: string;
  badge: string;
  color: string;
  burstAllowed: string;
  memoryCost: string;
  usedBy: string;
  mechanism: string;
}

const ALGORITHMS: Algorithm[] = [
  { id: 'token-bucket', name: 'Token Bucket', badge: 'Allows Controlled Bursts', color: '#38bdf8', burstAllowed: '✅ Yes (Up to bucket capacity)', memoryCost: 'Low (1 float timestamp/token per client)', usedBy: 'Amazon API Gateway, Stripe, AWS Services', mechanism: 'Tokens refill at constant rate R. Incoming request consumes 1 token. If tokens ≥ 1, allow; else 429.' },
  { id: 'sliding-window', name: 'Sliding Window Counter', badge: 'Smooth Rolling Window', color: '#34d399', burstAllowed: '⚠️ Partial (Smooths edge spikes)', memoryCost: 'Low (2 integers per client)', usedBy: 'Cloudflare, Nginx, Redis Limiters', mechanism: 'Weighted interpolation between previous and current fixed window counts based on rolling timestamp overlap.' },
  { id: 'fixed-window', name: 'Fixed Window Counter', badge: 'Simple Boundary Reset', color: '#fbbf24', burstAllowed: '❌ Vulnerable (Double rate at boundary)', memoryCost: 'Very Low (1 integer per client)', usedBy: 'Simple internal tools, low-stakes APIs', mechanism: 'Counter resets at fixed time intervals (e.g. top of every minute). Allows burst at window boundaries.' },
  { id: 'leaky-bucket', name: 'Leaky Bucket', badge: 'Smooth Constant Output', color: '#a78bfa', burstAllowed: '❌ No (Fixed processing rate)', memoryCost: 'Medium (Queue structure per client)', usedBy: 'Shopify, Async Task Queues, Throttling', mechanism: 'Requests enter a FIFO queue. Queue drains at a strictly constant rate. Drops requests when queue is full.' },
];

export default function RateLimitingAlgorithmsDiagram() {
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm>(ALGORITHMS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Rate Limiting Algorithm Comparison &amp; Mechanism Matrix</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {ALGORITHMS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAlgo(a)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              background: selectedAlgo.id === a.id ? `${a.color}20` : 'rgba(255,255,255,0.04)',
              color: selectedAlgo.id === a.id ? a.color : 'var(--ifm-color-content-secondary)',
              boxShadow: selectedAlgo.id === a.id ? `0 0 0 1.5px ${a.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 800, color: selectedAlgo.color }}>{selectedAlgo.name}</span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: `${selectedAlgo.color}30`, color: selectedAlgo.color, fontWeight: 700 }}>
            {selectedAlgo.badge}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Burst Handling</div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{selectedAlgo.burstAllowed}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Memory Overhead</div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{selectedAlgo.memoryCost}</div>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '6px' }}>
          <strong>Mechanism:</strong> {selectedAlgo.mechanism}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
          <strong>Production Adopters:</strong> {selectedAlgo.usedBy}
        </div>
      </div>
    </div>
  );
}
