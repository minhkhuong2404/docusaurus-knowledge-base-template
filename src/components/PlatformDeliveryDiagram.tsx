import React, { useState } from 'react';

type DeliveryTab = 'edge' | 'deployment' | 'ssg-ssr' | 'slo';

export default function PlatformDeliveryDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('edge');
  const [errorRate, setErrorRate] = useState<number>(0.2); // percentage

  // SLO 99.9% = error budget 0.1%
  const burnRate = (errorRate / 0.1).toFixed(1);
  const isBudgetExhausted = errorRate > 0.1;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .delivery-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Platform Delivery, Edge Caching & Modern CI/CD Reliability
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'edge', label: '🌍 Edge & Anycast Caching', color: '#38bdf8' },
            { id: 'deployment', label: '🚀 Blue-Green & Canary Gates', color: '#34d399' },
            { id: 'ssg-ssr', label: '⚡ SSG vs SSR vs ISR', color: '#fbbf24' },
            { id: 'slo', label: '🎯 SLOs & Error Budget Simulator', color: '#f87171' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DeliveryTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="Platform delivery and deployment pipeline"
        >
          <defs>
            <marker
              id="arrow-cyan-del"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-green-del"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Node 1: Edge CDN / Anycast Point of Presence */}
          <g>
            <rect x="30" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">1</text>
            <text x="115" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Anycast PoP</text>
            <text x="115" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Cloudflare / CloudFront</text>
            <text x="115" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">Surrogate Key Purge</text>
          </g>

          {/* Flow Line 1 to 2 */}
          <line x1="190" y1="90" x2="280" y2="90" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="190"
            y1="90"
            x2="280"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-cyan-del)"
          />

          {/* Node 2: Origin Shield / Tiered Cache */}
          <g>
            <rect x="285" y="45" width="170" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="310" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="310" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">2</text>
            <text x="375" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Origin Shield</text>
            <text x="375" y="88" textAnchor="middle" fill="#fbbf24" fontSize="10">Thundering Herd Shield</text>
            <text x="375" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Stale-While-Revalidate</text>
          </g>

          {/* Flow Line 2 to 3 */}
          <line x1="455" y1="90" x2="540" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="455"
            y1="90"
            x2="540"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-del)"
          />

          {/* Node 3: Canary Deployment Stage */}
          <g>
            <rect x="545" y="45" width="180" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="570" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="570" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">3</text>
            <text x="640" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Canary Gate (5%)</text>
            <text x="640" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Automated Rollback</text>
            <text x="640" y="112" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="600">SLO Error Budget Lock</text>
          </g>

          {/* Flow Line 3 to 4 */}
          <line x1="725" y1="90" x2="800" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="725"
            y1="90"
            x2="800"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-del)"
          />

          {/* Node 4: Production Cluster */}
          <g>
            <rect x="805" y="45" width="115" height="90" rx="10" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="828" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="828" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">✓</text>
            <text x="868" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Prod Fleet</text>
            <text x="868" y="88" textAnchor="middle" fill="#34d399" fontSize="9.5">100% Traffic</text>
            <text x="868" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Green Active</text>
          </g>
        </svg>
      </div>

      {/* Tab Contents */}
      {activeTab === 'edge' && (
        <div className="delivery-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Surrogate-Key & Tag-Based Edge Invalidation
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              URL-based caching (purging <code>/product/123</code>) breaks when product 123 appears in category pages, search results, and homepage carousels.
            </p>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <strong>Surrogate-Keys (Cache-Tags):</strong> The origin emits <code>Surrogate-Key: product-123 category-shoes brand-nike</code>. When product 123 changes, the CMS sends a single API call purging <code>product-123</code>. Fastly, Cloudflare, or Akamai immediately purges every cached page referencing that key across 300+ worldwide edge nodes in &lt; 150ms.
            </p>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Origin Shielding & Stale-While-Revalidate
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              When a popular item's cache expires, 10,000 edge nodes simultaneously request the origin, triggering an <strong>Origin Thundering Herd</strong>.
            </p>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <strong>Origin Shield:</strong> Designates a central regional point-of-presence between the edge nodes and the backend. Edge nodes request the Shield; the Shield collapses 10,000 requests into <strong>exactly 1 backend query</strong>. Paired with <code>stale-while-revalidate=60</code>, users never wait for backend regeneration.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'slo' && (
        <div className="delivery-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${isBudgetExhausted ? '#f87171' : '#34d399'}` }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              SLO Error Budget Burn Rate Simulator
            </h4>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--ifm-color-content-secondary)' }}>
                Observed Request Error Rate: <strong>{(errorRate * 100).toFixed(2)}%</strong> (SLO target: 99.9% availability)
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={errorRate}
                onChange={(e) => setErrorRate(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ background: isBudgetExhausted ? 'rgba(248, 113, 113, 0.1)' : 'rgba(52, 211, 153, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ color: isBudgetExhausted ? '#f87171' : '#34d399', fontWeight: 700 }}>
                  Burn Rate: {burnRate}x {isBudgetExhausted ? '⚠️ (Critical Fast Burn!)' : '✅ (Normal)'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  {isBudgetExhausted
                    ? 'At this burn rate, 30-day error budget will be completely exhausted in < 2.5 days. Deployment pipelines must freeze new feature releases immediately!'
                    : 'Error budget is healthy. Deployments are allowed to proceed.'}
                </div>
              </div>
            </div>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              The 14.4x Multi-Window Burn Rate Alerting Rule
            </h4>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
              Google SRE standard: Don't alert on simple error rate thresholds (which produce alert fatigue on brief spikes). Alert on <strong>Error Budget Burn Rate</strong> over dual time windows:
              <br /><br />
              • <strong>Page on-call:</strong> 14.4x burn rate over 1 hour consuming &gt; 2% of budget in 1 hour.
              <br />
              • <strong>Ticket to team:</strong> 6x burn rate over 6 hours consuming &gt; 5% of budget.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
            Canary Analysis: Automated Rollback Gates
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            Automated Canary Analysis (e.g. Kayenta or Argo Rollouts) routes 1%–5% of live traffic to the new version (Canary) and compares telemetry against an identical baseline fleet of the old version:
          </p>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
            <li><strong>Mann-Whitney U Test:</strong> Statistical hypothesis testing determines whether latency increases are statistically significant rather than background noise.</li>
            <li><strong>Automatic Instant Drain:</strong> If HTTP 5xx rate rises by &gt; 0.05% or P99 latency jumps by &gt; 20%, Envoy immediately sheds all traffic back to the primary fleet with zero human intervention.</li>
          </ul>
        </div>
      )}

      {activeTab === 'ssg-ssr' && (
        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24', marginTop: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '15px' }}>
            SSG vs SSR vs Incremental Static Regeneration (ISR)
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            When an e-commerce catalog grows from 5,000 to 500,000 SKUs, pure SSG (Static Site Generation) builds take 4 hours to compile, breaking CI/CD pipelines.
          </p>
          <div style={{ background: '#080a12', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11.5px', color: '#fbbf24' }}>
            <div>SSG: Pre-rendered at build time ➔ Fast TTFB, but build times explode with catalog size.</div>
            <div style={{ color: '#38bdf8', marginTop: '4px' }}>SSR: Rendered on-demand per request ➔ Instant updates, but higher server CPU and latency.</div>
            <div style={{ color: '#34d399', marginTop: '4px' }}>ISR: Hybrid ➔ Top 1,000 SKUs pre-rendered; remaining 499,000 generated on-first-visit and cached on CDN.</div>
          </div>
        </div>
      )}
    </div>
  );
}
