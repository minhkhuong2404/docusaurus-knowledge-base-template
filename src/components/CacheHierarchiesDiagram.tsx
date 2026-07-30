import React, { useState, useEffect } from 'react';

type FlowType = 'l1_hit' | 'l2_hit' | 'miss';

export default function CacheHierarchiesDiagram(): React.JSX.Element {
  const [flow, setFlow] = useState<FlowType>('l1_hit');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 1200);
    return () => clearTimeout(t);
  }, [flow]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Multi-Level Cache Hierarchies (L1 &rarr; L2 &rarr; DB)</span>
      </div>

      {/* Controller Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['l1_hit', 'l2_hit', 'miss'] as FlowType[]).map(f => {
          const isActive = flow === f;
          const label = f === 'l1_hit' ? 'L1 Cache Hit' : f === 'l2_hit' ? 'L1 Miss, L2 Hit' : 'L1 & L2 Miss (DB Fetch)';
          const color = f === 'l1_hit' ? '#34d399' : f === 'l2_hit' ? '#38bdf8' : '#fbbf24';
          return (
            <button
              key={f}
              onClick={() => setFlow(f)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.03)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.15s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .ch-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="ch-layout-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left SVG Display */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 360 220" className="interactive-diagram-svg">
            <defs>
              <marker id="ch-arr-marker" viewBox="0 0 10 10" refX="6" refY="3" orient="auto" markerWidth="6" markerHeight="6">
                <path d="M0,0 L0,6 L8,3 z" fill="context-fill" />
              </marker>
            </defs>

            {/* Application boundary */}
            <rect x="25" y="10" width="310" height="135" rx="8" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x="35" y="24" fill="rgba(255,255,255,0.3)" fontSize="7" fontWeight="bold">APP CONTAINER</text>

            {/* Layer L1: In-Memory */}
            <rect x="70" y="35" width="220" height="35" rx="5" fill="rgba(52,211,153,0.06)" stroke="#34d399" strokeWidth="1.5" />
            <text x="180" y="50" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="800">L1 Cache: In-Process (Caffeine/Guava)</text>
            <text x="180" y="62" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">Latency: ~10ns | RAM-local</text>

            {/* Layer L2: Redis */}
            <rect x="70" y="95" width="220" height="35" rx="5" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="180" y="110" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="800">L2 Cache: Shared (Redis Cluster)</text>
            <text x="180" y="122" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">Latency: ~1.5ms | Shared Network</text>

            {/* Database Layer */}
            <rect x="70" y="165" width="220" height="35" rx="5" fill="rgba(251,191,36,0.06)" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="180" y="180" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="800">Persistent Database (SQL/NoSQL)</text>
            <text x="180" y="192" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">Latency: ~20ms | Disk / ACID</text>

            {/* Paths */}
            {/* App to L1 */}
            {/* L1 to L2 */}
            <path
              id="p-l1-l2"
              d="M 180 70 L 180 92"
              fill="none"
              stroke={(flow === 'l2_hit' || flow === 'miss') ? '#38bdf8' : 'rgba(255,255,255,0.1)'}
              strokeWidth="1.5"
              strokeDasharray={(flow === 'l2_hit' || flow === 'miss') && animate ? '3,3' : 'none'}
              markerEnd="url(#ch-arr-marker)"
              style={{ stroke: (flow === 'l2_hit' || flow === 'miss') ? '#38bdf8' : 'rgba(255,255,255,0.1)' }}
            />

            {/* L2 to DB */}
            <path
              id="p-l2-db"
              d="M 180 130 L 180 162"
              fill="none"
              stroke={flow === 'miss' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}
              strokeWidth="1.5"
              strokeDasharray={flow === 'miss' && animate ? '3,3' : 'none'}
              markerEnd="url(#ch-arr-marker)"
              style={{ stroke: flow === 'miss' ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}
            />

            {/* Flow dots */}
            {animate && flow === 'l2_hit' && (
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.6s" repeatCount="1"><mpath href="#p-l1-l2"/></animateMotion>
              </circle>
            )}
            {animate && flow === 'miss' && (
              <g>
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="0.4s" repeatCount="1"><mpath href="#p-l1-l2"/></animateMotion>
                </circle>
                <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="0.4s" begin="0.4s" repeatCount="1"><mpath href="#p-l2-db"/></animateMotion>
                </circle>
              </g>
            )}
          </svg>
        </div>

        {/* Right Sizing Info */}
        <div className="interactive-diagram-details-card" style={{ borderColor: flow === 'l1_hit' ? '#34d399' : flow === 'l2_hit' ? '#38bdf8' : '#fbbf24' }}>
          {flow === 'l1_hit' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>⚡ L1 Cache Hit (In-Process RAM)</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Zero Network overhead**: Serve directly from Java heap memory. Speed is measured in CPU nanoseconds.</li>
                <li>**Capacity limits**: Local memory is limited by JVM allocations to avoid Garbage Collection pauses.</li>
                <li>**Use Cases**: Perfect for highly repetitive configuration keys, static translations, or hot metadata.</li>
              </ul>
            </div>
          )}
          {flow === 'l2_hit' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>🛡️ L1 Miss &rarr; L2 Cache Hit (Distributed Redis)</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**L1 Fallback**: Query misses local app RAM, checks Redis shared cluster over TCP (~1-2ms RTT).</li>
                <li>**State Sharing**: Shared across all application pods. Avoids split-brain or stale read issues.</li>
                <li>**Promotion**: The app caches the returned value in L1 locally for future instant reads.</li>
              </ul>
            </div>
          )}
          {flow === 'miss' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>⚠️ L1 & L2 Cache Miss (Full DB Fetch)</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Worst Case Flow**: Bypasses both cache rings, falling back to disk-backed database queries (~20-100ms).</li>
                <li>**Database Strain**: High frequency cache misses can exhaust DB thread pools and create lock bottlenecks.</li>
                <li>**Hydration**: App writes retrieved value to both L2 (Redis) and L1 (Local Caffeine) to shield subsequent hits.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
