import React, { useState } from 'react';

export default function NginxLoadBalancingDiagram() {
  const [algo, setAlgo] = useState<'rr' | 'wrr' | 'least' | 'hash'>('rr');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Nginx Load Balancing Algorithms</span>

        {/* Algo selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setAlgo('rr')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: algo === 'rr' ? '#38bdf820' : 'rgba(255,255,255,0.04)',
            color: algo === 'rr' ? '#38bdf8' : '#94a3b8'
          }}>
            Round Robin
          </button>
          <button onClick={() => setAlgo('wrr')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: algo === 'wrr' ? '#a78bfa20' : 'rgba(255,255,255,0.04)',
            color: algo === 'wrr' ? '#a78bfa' : '#94a3b8'
          }}>
            Weighted RR
          </button>
          <button onClick={() => setAlgo('least')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: algo === 'least' ? '#34d39920' : 'rgba(255,255,255,0.04)',
            color: algo === 'least' ? '#34d399' : '#94a3b8'
          }}>
            least_conn
          </button>
          <button onClick={() => setAlgo('hash')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: algo === 'hash' ? '#fbbf2420' : 'rgba(255,255,255,0.04)',
            color: algo === 'hash' ? '#fbbf24' : '#94a3b8'
          }}>
            ip_hash / hash
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
        <h3 style={{ color: '#38bdf8', margin: '0 0 6px 0', fontSize: '14px' }}>
          {algo === 'rr' && 'Round Robin (Default)'}
          {algo === 'wrr' && 'Weighted Round Robin (Canary & Heterogeneous Cores)'}
          {algo === 'least' && 'Least Connections (least_conn)'}
          {algo === 'hash' && 'IP Hash & Consistent URI Hash'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {algo === 'rr' && 'Rotates requests sequentially across backends (A -> B -> C). Best for uniform stateless backends.'}
          {algo === 'wrr' && 'Distributes proportion of requests according to server weight (weight=3 gets 60% of traffic). Ideal for canary releases.'}
          {algo === 'least' && 'Directs request to server with fewest active connections. Prevents backend queue congestion when response latencies vary.'}
          {algo === 'hash' && 'Hashes client IP or request URI key. Ensures request affinity for cache locality or legacy session state.'}
        </p>
      </div>
    </div>
  );
}
