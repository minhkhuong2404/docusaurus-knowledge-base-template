import React, { useState } from 'react';

export default function CacheAmatEconomicsDiagram({ initialTab = 'calculator' }: { initialTab?: 'lifecycle' | 'calculator' | 'scenarios' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'calculator' | 'scenarios'>(initialTab);
  const [tDb, setTDb] = useState<number>(50);
  const [rRead, setRRead] = useState<number>(1);
  const [rWrite, setRWrite] = useState<number>(1);
  const [hitRatioPct, setHitRatioPct] = useState<number>(80);
  const appOverhead = 5;

  // Calculations
  const tNoCache = appOverhead + tDb;
  const tHit = appOverhead + rRead;
  const tMiss = appOverhead + rRead + tDb + rWrite;
  const missPenalty = tMiss - tHit; // tDb + rWrite
  const h = hitRatioPct / 100;
  const amat = tHit + (1 - h) * missPenalty;
  const breakEvenH = (rRead + rWrite) / (tDb + rWrite);
  const breakEvenPct = Math.min(100, Math.max(0, breakEvenH * 100));
  const latencyDelta = tNoCache - amat; // Positive means cache is faster
  const isProfitable = amat < tNoCache;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Mathematical Economics of Caching: AMAT & Break-Even Explorer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('lifecycle')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'lifecycle' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'lifecycle' ? '#38bdf818' : 'transparent',
              color: activeTab === 'lifecycle' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Request Lifecycle
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'calculator' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'calculator' ? '#38bdf818' : 'transparent',
              color: activeTab === 'calculator' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            AMAT Calculator
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'scenarios' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'scenarios' ? '#38bdf818' : 'transparent',
              color: activeTab === 'scenarios' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Heavy vs Fast Scenarios
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Request Lifecycle */}
        {activeTab === 'lifecycle' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {/* Card 1: No Cache */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px' }}>1. No Cache Architecture</span>
                  <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', background: '#38bdf818', padding: '2px 8px', borderRadius: '4px' }}>
                    Baseline
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  Client ──► App (5ms) ──► DB (T_db) ──► Client
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#38bdf8',
                  borderLeft: '3px solid #38bdf8'
                }}>
                  Total = T_db + 5ms (0ms delta)
                </div>
              </div>

              {/* Card 2: Cache Hit */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                padding: '14px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: '13px' }}>2. Cache Hit Path</span>
                  <span style={{ fontSize: '11px', color: '#34d399', background: '#34d39918', padding: '2px 8px', borderRadius: '4px' }}>
                    Saves (T_db - 1ms)
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  Client ──► App (5ms) ──► Cache Read RTT (1ms) ──► Return
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#34d399',
                  borderLeft: '3px solid #34d399'
                }}>
                  Total = 5ms + 1ms = 6ms
                </div>
              </div>

              {/* Card 3: Cache Miss Penalty */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                padding: '14px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#f87171', fontWeight: 700, fontSize: '13px' }}>3. Cache Miss (Sync Write)</span>
                  <span style={{ fontSize: '11px', color: '#f87171', background: '#f8717118', padding: '2px 8px', borderRadius: '4px' }}>
                    +2ms RTT Penalty
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  Client ──► App (5ms) ──► Cache Read (1ms) ──► DB (T_db) ──► Cache Write (1ms)
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#f87171',
                  borderLeft: '3px solid #f87171'
                }}>
                  Total = T_db + 7ms (+2ms network penalty)
                </div>
              </div>
            </div>

            <div style={{
              background: '#0d0f1e',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              color: 'var(--ifm-color-content-secondary)',
              lineHeight: 1.6
            }}>
              <strong style={{ color: '#fbbf24' }}>Architectural Insight:</strong> Caching is never free. A cache miss does not merely fetch from the DB; it performs a round-trip cache probe followed by an authoritative sync write, introducing a strictly additive <span style={{ color: '#f87171', fontWeight: 700 }}>+2ms RTT penalty</span>.
            </div>
          </div>
        )}

        {/* Tab 2: Interactive AMAT Calculator */}
        {activeTab === 'calculator' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55% 45%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: Sliders */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '14px' }}>
                  Input Parameters
                </div>

                {/* Database Latency Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--ifm-color-content)' }}>Database Execution Time (T_db):</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>{tDb} ms</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={tDb}
                    onChange={(e) => setTDb(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#fbbf24' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    <span>1ms (Indexed PK lookup)</span>
                    <span>50ms (Join/Agg)</span>
                    <span>100ms (Heavy query)</span>
                  </div>
                </div>

                {/* Hit Ratio Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--ifm-color-content)' }}>Actual Cache Hit Ratio (H):</span>
                    <span style={{ color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>{hitRatioPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={hitRatioPct}
                    onChange={(e) => setHitRatioPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    <span>0% (All Misses)</span>
                    <span>50%</span>
                    <span>100% (All Hits)</span>
                  </div>
                </div>

                {/* Network RTT controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
                      Cache Read RTT (ms)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.5"
                      value={rRead}
                      onChange={(e) => setRRead(Math.max(0.1, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        background: '#090b14',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--ifm-color-content)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
                      Cache Write RTT (ms)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.5"
                      value={rWrite}
                      onChange={(e) => setRWrite(Math.max(0.1, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        background: '#090b14',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--ifm-color-content)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Computed Output */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: isProfitable ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                    Economic Analysis
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isProfitable ? '#34d39918' : '#f8717118',
                    color: isProfitable ? '#34d399' : '#f87171',
                    border: isProfitable ? '1px solid #34d39940' : '1px solid #f8717140'
                  }}>
                    {isProfitable ? 'PROFITABLE CACHE' : 'DEGRADED PERFORMANCE'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>No-Cache Latency</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                      {tNoCache.toFixed(1)} ms
                    </div>
                  </div>
                  <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Calculated AMAT</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: isProfitable ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                      {amat.toFixed(1)} ms
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#090b14',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Required Break-Even Hit Ratio:</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>
                      {breakEvenPct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Net Latency Delta:</span>
                    <span style={{ color: isProfitable ? '#34d399' : '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>
                      {latencyDelta >= 0 ? `+${latencyDelta.toFixed(1)}ms faster` : `${latencyDelta.toFixed(1)}ms SLOWER`}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {hitRatioPct >= breakEvenPct ? (
                    <span style={{ color: '#34d399' }}>
                      With {hitRatioPct}% hit ratio exceeding the {breakEvenPct.toFixed(1)}% threshold, caching yields net latency savings of {latencyDelta.toFixed(1)}ms per request.
                    </span>
                  ) : (
                    <span style={{ color: '#f87171' }}>
                      Hit ratio ({hitRatioPct}%) is below the break-even threshold ({breakEvenPct.toFixed(1)}%). Cache misses dominate and slow down overall API response times!
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

        {/* Tab 3: Heavy vs Fast Scenarios */}
        {activeTab === 'scenarios' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {/* Heavy Query */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: '13px' }}>Scenario A: Heavy Query (50ms)</span>
                  <span style={{ fontSize: '11px', color: '#34d399', background: '#34d39918', padding: '2px 6px', borderRadius: '4px' }}>
                    H ≥ 3.9%
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  • <strong>No Cache:</strong> 55ms<br />
                  • <strong>Cache Hit:</strong> 6ms (Saves 49ms)<br />
                  • <strong>Cache Miss:</strong> 57ms (Penalty +2ms)<br />
                  • <strong>Break-Even:</strong> 2 / (50 + 1) = <strong>3.9%</strong>
                </div>
                <div style={{ background: '#090b14', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#34d399' }}>
                  <strong>Takeaway:</strong> Only 1 hit out of 25 requests overcomes the penalty. Caching heavy queries is virtually always profitable.
                </div>
              </div>

              {/* Fast Query */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#f87171', fontWeight: 700, fontSize: '13px' }}>Scenario B: Fast Query (2ms)</span>
                  <span style={{ fontSize: '11px', color: '#f87171', background: '#f8717118', padding: '2px 6px', borderRadius: '4px' }}>
                    H ≥ 66.7%
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  • <strong>No Cache:</strong> 7ms<br />
                  • <strong>Cache Hit:</strong> 6ms (Saves only 1ms)<br />
                  • <strong>Cache Miss:</strong> 9ms (Penalty +2ms)<br />
                  • <strong>Break-Even:</strong> 2 / (2 + 1) = <strong>66.7%</strong>
                </div>
                <div style={{ background: '#090b14', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#f87171' }}>
                  <strong>Takeaway:</strong> A hit ratio of 50% makes the API strictly slower on average than querying the database directly!
                </div>
              </div>
            </div>

            {/* Visual Bar Comparison */}
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '14px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
                Break-Even Hit Ratio Threshold Comparison
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  <span>Heavy DB Query (T_db = 50ms)</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>3.9%</span>
                </div>
                <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '3.9%', height: '100%', background: '#34d399', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  <span>Ultra-Fast DB Query (T_db = 2ms)</span>
                  <span style={{ color: '#f87171', fontWeight: 700 }}>66.7%</span>
                </div>
                <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '66.7%', height: '100%', background: '#f87171', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
