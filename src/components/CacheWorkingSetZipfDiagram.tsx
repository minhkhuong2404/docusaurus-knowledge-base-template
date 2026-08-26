import React, { useState } from 'react';

export default function CacheWorkingSetZipfDiagram({ initialTab = 'zipf' }: { initialTab?: 'rings' | 'zipf' | 'diagnostics' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'rings' | 'zipf' | 'diagnostics'>(initialTab);
  const [selectedRamIndex, setSelectedRamIndex] = useState<number>(3); // default 1GB (index 3)
  const [sizingScenario, setSizingScenario] = useState<'optimal' | 'undersized' | 'oversized'>('optimal');

  const zipfData = [
    { ram: '125 MB', items: '25,000 items', hitRatio: 83.7, marginal: 'Base', status: 'normal', color: '#38bdf8' },
    { ram: '250 MB', items: '50,000 items', hitRatio: 89.2, marginal: '+5.5%', status: 'normal', color: '#38bdf8' },
    { ram: '500 MB', items: '100,000 items', hitRatio: 94.6, marginal: '+5.4%', status: 'normal', color: '#38bdf8' },
    { ram: '1 GB', items: '200,000 items (Working Set)', hitRatio: 99.8, marginal: '+5.2%', status: 'optimal', color: '#34d399' },
    { ram: '2 GB', items: '400,000 items (Tail items)', hitRatio: 99.9, marginal: '+0.1% (Zero Marginal Return)', status: 'waste', color: '#f87171' }
  ];

  const currentZipf = zipfData[selectedRamIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Working Set vs. Total Dataset & Zipf's Law Sizing
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('zipf')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'zipf' ? '1px solid #fbbf2450' : '1px solid transparent',
              background: activeTab === 'zipf' ? '#fbbf2418' : 'transparent',
              color: activeTab === 'zipf' ? '#fbbf24' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Zipf Diminishing Returns
          </button>
          <button
            onClick={() => setActiveTab('rings')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'rings' ? '1px solid #fbbf2450' : '1px solid transparent',
              background: activeTab === 'rings' ? '#fbbf2418' : 'transparent',
              color: activeTab === 'rings' ? '#fbbf24' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Concentric Architecture
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'diagnostics' ? '1px solid #fbbf2450' : '1px solid transparent',
              background: activeTab === 'diagnostics' ? '#fbbf2418' : 'transparent',
              color: activeTab === 'diagnostics' ? '#fbbf24' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Diagnostics Matrix
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Zipf's Law & Diminishing Returns */}
        {activeTab === 'zipf' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55% 45%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: RAM Selector & Curve */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '12px' }}>
                  Select Provisioned RAM (2M Products / 10GB Catalog):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '16px' }}>
                  {zipfData.map((item, idx) => (
                    <button
                      key={item.ram}
                      onClick={() => setSelectedRamIndex(idx)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: selectedRamIndex === idx ? `1px solid ${item.color}` : '1px solid rgba(255,255,255,0.08)',
                        background: selectedRamIndex === idx ? `${item.color}18` : '#090b14',
                        color: selectedRamIndex === idx ? item.color : 'var(--ifm-color-content-secondary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {item.ram}
                    </button>
                  ))}
                </div>

                {/* SVG Zipf Hit Ratio Curve */}
                <div style={{
                  background: '#090b14',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
                    <span>Hit Ratio vs. Memory Allocation</span>
                    <span style={{ color: currentZipf.color, fontWeight: 700 }}>
                      {currentZipf.hitRatio}% Hit Ratio
                    </span>
                  </div>

                  <svg width="100%" height="110" viewBox="0 0 400 110" style={{ overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1="40" y1="15" x2="380" y2="15" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <line x1="40" y1="50" x2="380" y2="50" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <line x1="40" y1="85" x2="380" y2="85" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

                    <text x="35" y="18" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="end">100%</text>
                    <text x="35" y="53" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="end">90%</text>
                    <text x="35" y="88" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="end">80%</text>

                    {/* Zipf Power Law Curve */}
                    <path
                      d="M 60 78 Q 130 50, 200 30 T 300 16 L 370 15"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                    />

                    {/* Points */}
                    {zipfData.map((d, i) => {
                      const coords = [
                        { cx: 60, cy: 78 },
                        { cx: 130, cy: 52 },
                        { cx: 210, cy: 30 },
                        { cx: 300, cy: 16 },
                        { cx: 370, cy: 15 }
                      ];
                      const isSel = selectedRamIndex === i;
                      return (
                        <g key={d.ram} onClick={() => setSelectedRamIndex(i)} style={{ cursor: 'pointer' }}>
                          <circle
                            cx={coords[i].cx}
                            cy={coords[i].cy}
                            r={isSel ? 6 : 4}
                            fill={isSel ? d.color : '#090b14'}
                            stroke={d.color}
                            strokeWidth="2"
                          />
                          <text
                            x={coords[i].cx}
                            y="102"
                            fill={isSel ? d.color : 'var(--ifm-color-content-secondary)'}
                            fontSize="9"
                            textAnchor="middle"
                            fontWeight={isSel ? 700 : 400}
                          >
                            {d.ram}
                          </text>
                        </g>
                      );
                    })}

                    {/* Efficiency Wall Marker */}
                    <line x1="300" y1="5" x2="300" y2="90" stroke="#f87171" strokeDasharray="2 2" strokeWidth="1.5" />
                    <text x="302" y="10" fill="#f87171" fontSize="8" fontWeight="700">EFFICIENCY WALL</text>
                  </svg>
                </div>
              </div>

              {/* Right Column: Details & Takeaway */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: `1px solid ${currentZipf.color}40`,
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                    Capacity Evaluation: {currentZipf.ram}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${currentZipf.color}18`,
                    color: currentZipf.color,
                    border: `1px solid ${currentZipf.color}40`
                  }}>
                    {currentZipf.status === 'optimal' ? 'OPTIMAL WORKING SET' : currentZipf.status === 'waste' ? 'DIMINISHING RETURNS' : 'SUB-OPTIMAL'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Cached Items</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
                      {currentZipf.items}
                    </div>
                  </div>
                  <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Marginal Hit Gain</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: currentZipf.color, fontFamily: 'monospace' }}>
                      {currentZipf.marginal}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#090b14',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: 'var(--ifm-color-content-secondary)'
                }}>
                  {selectedRamIndex === 3 && (
                    <span style={{ color: '#34d399' }}>
                      <strong>Sweet Spot:</strong> 1 GB fits the top 200,000 active items (10% of total catalog) which account for ~100% of peak queries under Zipf distribution (alpha ≈ 1).
                    </span>
                  )}
                  {selectedRamIndex === 4 && (
                    <span style={{ color: '#f87171' }}>
                      <strong>The RAM Sizing Trap:</strong> Doubling RAM from 1 GB to 2 GB costs 2x infrastructure budget for only +0.1% hit ratio! The tail items receive zero repeat traffic.
                    </span>
                  )}
                  {selectedRamIndex < 3 && (
                    <span>
                      At {currentZipf.ram}, the cache suffers continuous eviction cycles because it cannot hold the entire 200,000 item working set.
                    </span>
                  )}
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

        {/* Tab 2: Concentric Architecture */}
        {activeTab === 'rings' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setSizingScenario('optimal')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: sizingScenario === 'optimal' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  background: sizingScenario === 'optimal' ? '#34d39918' : '#0c0e17',
                  color: sizingScenario === 'optimal' ? '#34d399' : 'var(--ifm-color-content-secondary)'
                }}
              >
                Optimal Fit (RAM &gt; Working Set)
              </button>
              <button
                onClick={() => setSizingScenario('undersized')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: sizingScenario === 'undersized' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                  background: sizingScenario === 'undersized' ? '#f8717118' : '#0c0e17',
                  color: sizingScenario === 'undersized' ? '#f87171' : 'var(--ifm-color-content-secondary)'
                }}
              >
                Under-Provisioned (RAM &lt; Working Set)
              </button>
              <button
                onClick={() => setSizingScenario('oversized')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: sizingScenario === 'oversized' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                  background: sizingScenario === 'oversized' ? '#fbbf2418' : '#0c0e17',
                  color: sizingScenario === 'oversized' ? '#fbbf24' : 'var(--ifm-color-content-secondary)'
                }}
              >
                Over-Provisioned (RAM &gt;&gt; Working Set)
              </button>
            </div>

            {/* SVG Diagram of Concentric Boxes */}
            <div style={{
              background: '#090b14',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '16px'
            }}>
              <svg width="100%" height="200" viewBox="0 0 600 200">
                {/* Outer Box: Database Dataset (500GB) */}
                <rect x="20" y="20" width="560" height="160" rx="10" fill="#0d1117" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="35" y="42" fill="#38bdf8" fontSize="12" fontWeight="700">AUTHORITATIVE DATABASE DATASET (500 GB)</text>
                <text x="35" y="58" fill="var(--ifm-color-content-secondary)" fontSize="10">Grows continuously over time with every historical write</text>

                {/* Middle Box: Active Working Set (8GB) */}
                <rect x="80" y="70" width="440" height="95" rx="8" fill="#161b22" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="95" y="90" fill="#fbbf24" fontSize="11" fontWeight="700">ACTIVE WORKING SET (8 GB)</text>
                <text x="95" y="104" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Subset queried by 95% of concurrent active users at peak</text>

                {/* Inner Box: Cache RAM */}
                {sizingScenario === 'optimal' && (
                  <g>
                    <rect x="120" y="112" width="360" height="42" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="2" />
                    <text x="135" y="132" fill="#34d399" fontSize="11" fontWeight="700">CACHE RAM CAPACITY: 10 GB</text>
                    <text x="135" y="146" fill="#34d399" fontSize="9">Working Set fits cleanly in RAM • Eviction is dormant • Hit ratio ~99%</text>
                  </g>
                )}
                {sizingScenario === 'undersized' && (
                  <g>
                    <rect x="120" y="112" width="180" height="42" rx="6" fill="#f8717118" stroke="#f87171" strokeWidth="2" />
                    <text x="130" y="132" fill="#f87171" fontSize="11" fontWeight="700">CACHE RAM: 4 GB (TRUNCATED)</text>
                    <text x="130" y="146" fill="#f87171" fontSize="9">Continuous eviction thrashing!</text>
                  </g>
                )}
                {sizingScenario === 'oversized' && (
                  <g>
                    <rect x="60" y="60" width="480" height="112" rx="6" fill="#fbbf2410" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="75" y="78" fill="#fbbf24" fontSize="10" fontWeight="700">CACHE RAM: 64 GB (OVERSIZED)</text>
                    <text x="75" y="165" fill="#fbbf24" fontSize="9">Wasteful RAM holding zero-traffic cold data with no hit ratio gain</text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* Tab 3: Diagnostics Matrix */}
        {activeTab === 'diagnostics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              padding: '14px'
            }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                Cache Size &gt; Working Set Size
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                • <strong>Eviction Behavior:</strong> Rarely or never occurs.<br />
                • <strong>Hit Ratio Impact:</strong> Any standard eviction policy (LRU, LFU, FIFO) achieves nearly identical near-perfect hit ratios.<br />
                • <strong>Architecture Focus:</strong> Focus on TTL correctness and cache synchronization.
              </div>
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              padding: '14px'
            }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                Cache Size &lt; Working Set Size
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                • <strong>Eviction Behavior:</strong> Continuous eviction on every write.<br />
                • <strong>Hit Ratio Impact:</strong> Eviction and admission policies directly determine system survival.<br />
                • <strong>Root Cause Diagnostic:</strong> If Hit Ratio is poor while RAM is NOT full, the cause is <strong>TTL Expiration or Premature Invalidation</strong>, never Eviction!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
