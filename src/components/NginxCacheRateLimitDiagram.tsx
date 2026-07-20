import React, { useState } from 'react';

export default function NginxCacheRateLimitDiagram() {
  const [tab, setTab] = useState<'cache' | 'ratelimit'>('cache');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <span>Nginx Proxy Caching & Rate Limiting (Leaky Bucket)</span>

        {/* Tab selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setTab('cache')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: tab === 'cache' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: tab === 'cache' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: tab === 'cache' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Proxy Caching Architecture
          </button>

          <button onClick={() => setTab('ratelimit')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: tab === 'ratelimit' ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: tab === 'ratelimit' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: tab === 'ratelimit' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Rate Limiting (burst + nodelay)
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: tab === 'cache' ? '#34d39940' : '#fbbf2440' }}>
        <h3 style={{ color: tab === 'cache' ? '#34d399' : '#fbbf24', margin: '0 0 6px 0', fontSize: '14px' }}>
          {tab === 'cache' ? 'Proxy Cache Hit/Miss Architecture' : 'Leaky Bucket Rate Limiting (limit_req)'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {tab === 'cache'
            ? 'On Cache HIT, Nginx returns the cached response directly from memory/disk in <1ms without touching upstream. On Cache MISS, Nginx proxies to upstream, buffers response, stores in proxy_cache_path, and returns to client.'
            : 'limit_req rate=100r/s burst=200 nodelay: Allows up to 200 requests in an immediate burst to be served immediately (nodelay). Subsequent requests exceeding 100r/s are rejected with HTTP 429.'
          }
        </p>
      </div>
    </div>
  );
}
