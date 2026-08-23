import React, { useState } from 'react';

export default function CacheObservabilityPitfallsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'p99deception' | 'infostats' | 'micrometer'>('p99deception');
  const [cacheName, setCacheName] = useState<string>('products');
  const [windowRange, setWindowRange] = useState<string>('5m');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Observability Pitfalls: Measuring Cache Health &amp; Tail Latency
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('p99deception')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'p99deception' ? '1px solid #f8717150' : '1px solid transparent',
              background: activeTab === 'p99deception' ? '#f8717118' : 'transparent',
              color: activeTab === 'p99deception' ? '#f87171' : 'var(--ifm-color-content-secondary)'
            }}
          >
            P99 Latency Deception
          </button>
          <button
            onClick={() => setActiveTab('infostats')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'infostats' ? '1px solid #f8717150' : '1px solid transparent',
              background: activeTab === 'infostats' ? '#f8717118' : 'transparent',
              color: activeTab === 'infostats' ? '#f87171' : 'var(--ifm-color-content-secondary)'
            }}
          >
            INFO Stats Trap
          </button>
          <button
            onClick={() => setActiveTab('micrometer')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'micrometer' ? '1px solid #f8717150' : '1px solid transparent',
              background: activeTab === 'micrometer' ? '#f8717118' : 'transparent',
              color: activeTab === 'micrometer' ? '#f87171' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Tagged Metrics Solution
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: P99 Latency Deception */}
        {activeTab === 'p99deception' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55% 45%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: Metrics Breakdown */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '10px' }}>
                  Trap 1: Request Hit Ratio vs. Key Hit Ratio
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  Suppose 250MB RAM only holds 50,000 out of 200,000 active catalog items (25% unique keys cached).
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid #34d39940' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Request Hit Ratio</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>89.2%</div>
                    <div style={{ fontSize: '9px', color: '#34d399' }}>Looks great on dashboard</div>
                  </div>
                  <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid #f8717140' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Key Hit Ratio</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', fontFamily: 'monospace' }}>25.0%</div>
                    <div style={{ fontSize: '9px', color: '#f87171' }}>75% of items miss</div>
                  </div>
                </div>

                {/* Latency Percentiles */}
                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Average Latency:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>~11.5 ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>P90 Latency:</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>~6.0 ms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>P99 / P99.9 Latency:</span>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>57.0 ms (Catastrophic tail!)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Stream */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
                  Request Stream Latency Distribution:
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', marginBottom: '8px', borderLeft: '3px solid #34d399' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>89.2% of Requests (Hot 25% Keys)</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Hit Cache &rarr; 6ms ultra-fast response</div>
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', marginBottom: '12px', borderLeft: '3px solid #f87171' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>10.8% of Requests (Cold 75% Keys)</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>Miss Cache &rarr; 57ms (+2ms network penalty!)</div>
                </div>

                <div style={{ fontSize: '11px', color: '#f87171', lineHeight: 1.5 }}>
                  <strong>Takeaway:</strong> Never judge cache health solely on aggregate hit ratio. Always monitor P95/P99 latency percentiles to detect severe tail degradation on niche and long-tail keys.
                </div>
              </div>
            </div>
            <style>{`
              @media (max-width: 768px) {
                div[style*="grid-template-columns: 55% 45%"] {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* Tab 2: INFO Stats Trap */}
        {activeTab === 'infostats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              padding: '14px'
            }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                1. Cumulative Lifetime Counter Trap
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
                `INFO stats` returns monotonic counters since Redis boot time (weeks or months):
                <pre style={{ margin: '6px 0', padding: '8px', background: '#090b14', borderRadius: '4px', fontSize: '10.5px', color: '#fbbf24' }}>
                  keyspace_hits: 84,920,194{'\n'}
                  keyspace_misses: 4,102,910{'\n'}
                  Calculated: 95.3% Hit Rate
                </pre>
                <strong>Flaw:</strong> A multi-week 95.3% aggregate completely masks an in-progress localized hit ratio collapse (e.g. down to 20%) during a flash sale incident!
              </div>
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              padding: '14px'
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                2. Cross-Domain Cache Obfuscation
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                If you store multiple application data sets in the same Redis instance:
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li><strong>Session Cache:</strong> 10M requests/min with 99.5% hit rate.</li>
                  <li><strong>Product Catalog:</strong> 100k requests/min with <strong>0% hit rate (broken key prefix!)</strong>.</li>
                </ul>
                <div style={{ background: '#090b14', padding: '8px', borderRadius: '4px', marginTop: '10px', color: '#f87171' }}>
                  The overwhelming session traffic drowns out the product catalog outage on `INFO stats`!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tagged Metrics Solution */}
        {activeTab === 'micrometer' && (
          <div>
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              padding: '16px',
              marginBottom: '14px'
            }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                Production Standard: Application-Layer Tagged Metrics via Micrometer
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                Always record telemetry per cache region at the application boundary, tagged with `name` and `result` (hit/miss).
              </div>

              {/* Interactive PromQL Query Builder */}
              <div style={{ background: '#090b14', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', display: 'block' }}>Cache Region:</label>
                    <select
                      value={cacheName}
                      onChange={(e) => setCacheName(e.target.value)}
                      style={{ background: '#0c0e17', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ifm-color-content)', borderRadius: '4px', fontSize: '11px', padding: '2px 6px' }}
                    >
                      <option value="products">products</option>
                      <option value="sessions">sessions</option>
                      <option value="user_profile">user_profile</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', display: 'block' }}>Sliding Window:</label>
                    <select
                      value={windowRange}
                      onChange={(e) => setWindowRange(e.target.value)}
                      style={{ background: '#0c0e17', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ifm-color-content)', borderRadius: '4px', fontSize: '11px', padding: '2px 6px' }}
                    >
                      <option value="1m">1 minute</option>
                      <option value="5m">5 minutes</option>
                      <option value="15m">15 minutes</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>PromQL Real-Time Sliding Hit Ratio Query:</div>
                <pre style={{ margin: 0, padding: '8px', background: '#05070e', borderRadius: '4px', fontSize: '11px', color: '#38bdf8', overflowX: 'auto' }}>
{`sum(rate(cache_gets_total{name="${cacheName}", result="hit"}[${windowRange}]))
/
sum(rate(cache_gets_total{name="${cacheName}"}[${windowRange}]))`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
