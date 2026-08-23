import React, { useState } from 'react';

export default function CacheTwoMemoryGatesDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'gates' | 'pollution' | 'families'>('gates');
  const [selectedGate, setSelectedGate] = useState<'admission' | 'memory' | 'eviction'>('admission');
  const [scanScenario, setScanScenario] = useState<'naive' | 'tinylfu'>('naive');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          The Two Memory Gates: Admission Policy vs. Eviction Policy
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('gates')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'gates' ? '1px solid #34d39950' : '1px solid transparent',
              background: activeTab === 'gates' ? '#34d39918' : 'transparent',
              color: activeTab === 'gates' ? '#34d399' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Two Gates Architecture
          </button>
          <button
            onClick={() => setActiveTab('pollution')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'pollution' ? '1px solid #34d39950' : '1px solid transparent',
              background: activeTab === 'pollution' ? '#34d39918' : 'transparent',
              color: activeTab === 'pollution' ? '#34d399' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Pollution &amp; Scan Simulator
          </button>
          <button
            onClick={() => setActiveTab('families')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'families' ? '1px solid #34d39950' : '1px solid transparent',
              background: activeTab === 'families' ? '#34d39918' : 'transparent',
              color: activeTab === 'families' ? '#34d399' : 'var(--ifm-color-content-secondary)'
            }}
          >
            3 Eviction Families
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Two Gates Architecture Flow */}
        {activeTab === 'gates' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '58% 42%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: Interactive SVG Flow */}
              <div style={{
                background: '#090b14',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
                  Click a stage to inspect its memory governance mechanics:
                </div>

                <svg width="100%" height="240" viewBox="0 0 360 240">
                  <defs>
                    <marker id="arrow-admission" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <path d="M0,1 L7,4 L0,7" fill="#38bdf8" />
                    </marker>
                    <marker id="arrow-pass" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <path d="M0,1 L7,4 L0,7" fill="#34d399" />
                    </marker>
                    <marker id="arrow-evict" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <path d="M0,1 L7,4 L0,7" fill="#f87171" />
                    </marker>
                  </defs>

                  {/* Top: Incoming Request */}
                  <rect x="110" y="10" width="140" height="30" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                  <text x="180" y="29" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">INCOMING REQUEST</text>

                  {/* Flow Arrow to Gate 1 */}
                  <line x1="180" y1="40" x2="180" y2="60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-admission)" />

                  {/* Gate 1: Admission Gate */}
                  <g onClick={() => setSelectedGate('admission')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="70"
                      y="65"
                      width="220"
                      height="45"
                      rx="8"
                      fill={selectedGate === 'admission' ? '#34d39922' : '#0f172a'}
                      stroke={selectedGate === 'admission' ? '#34d399' : '#34d39980'}
                      strokeWidth="2"
                    />
                    <text x="180" y="85" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">GATE 1: ADMISSION POLICY (IN)</text>
                    <text x="180" y="99" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="middle">"Does this key deserve to enter RAM?"</text>
                  </g>

                  {/* Arrow Qualified vs Rejected */}
                  <line x1="180" y1="110" x2="180" y2="135" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow-pass)" />
                  <text x="188" y="125" fill="#34d399" fontSize="8" fontWeight="600">Admitted</text>

                  <path d="M 290 87 L 330 87 L 330 140" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-evict)" />
                  <text x="335" y="115" fill="#f87171" fontSize="8">Drop / Bypass</text>

                  {/* Cache Memory RAM */}
                  <g onClick={() => setSelectedGate('memory')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="90"
                      y="140"
                      width="180"
                      height="35"
                      rx="6"
                      fill={selectedGate === 'memory' ? '#38bdf822' : '#0d1117'}
                      stroke={selectedGate === 'memory' ? '#38bdf8' : '#38bdf880'}
                      strokeWidth="2"
                    />
                    <text x="180" y="162" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">CACHE MEMORY RAM</text>
                  </g>

                  {/* Flow Arrow to Gate 2 (When Full) */}
                  <line x1="180" y1="175" x2="180" y2="195" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#arrow-evict)" />
                  <text x="188" y="187" fill="#f87171" fontSize="8">If Memory Full</text>

                  {/* Gate 2: Eviction Gate */}
                  <g onClick={() => setSelectedGate('eviction')} style={{ cursor: 'pointer' }}>
                    <rect
                      x="70"
                      y="198"
                      width="220"
                      height="38"
                      rx="8"
                      fill={selectedGate === 'eviction' ? '#f8717122' : '#0f172a'}
                      stroke={selectedGate === 'eviction' ? '#f87171' : '#f8717180'}
                      strokeWidth="2"
                    />
                    <text x="180" y="215" fill="#f87171" fontSize="11" fontWeight="700" textAnchor="middle">GATE 2: EVICTION POLICY (OUT)</text>
                    <text x="180" y="228" fill="var(--ifm-color-content-secondary)" fontSize="8.5" textAnchor="middle">"Which victim item has least future utility?"</text>
                  </g>
                </svg>
              </div>

              {/* Right Column: Gate Details Panel */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px'
              }}>
                {selectedGate === 'admission' && (
                  <div>
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      Gate 1: Admission Policy (Entrance)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      Standard naive caches leave the entrance wide open. Modern high-performance caches protect memory using 4 admission strategies:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                        <strong>1. No Admission (Default):</strong> Wide open gate (standard Redis). Vulnerable to scan attacks.
                      </div>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                        <strong>2. N-Hit Admission:</strong> Requires ≥ N misses in a sliding window (Bloom filter) before admitting.
                      </div>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #a78bfa' }}>
                        <strong>3. Size-Aware:</strong> Rejects large items whose footprint exceeds marginal hit ratio value (CDNs).
                      </div>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                        <strong>4. TinyLFU Frequency Gate:</strong> Duels incoming item against eviction victim using Count-Min Sketch.
                      </div>
                    </div>
                  </div>
                )}

                {selectedGate === 'memory' && (
                  <div>
                    <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      Cache Memory Space
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      Holds the active Working Set. Memory pressure occurs when dataset size exceeds provisioned RAM threshold (`maxmemory`).
                    </div>
                    <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                      When memory saturation reaches 100%, writes synchronously trigger Gate 2 (Eviction Policy) to expel the lowest-priority item.
                    </div>
                  </div>
                )}

                {selectedGate === 'eviction' && (
                  <div>
                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                      Gate 2: Eviction Policy (Exit Gate)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      Selects the victim entry with the lowest probability of being accessed again in the future:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                        <strong>LRU (Recency):</strong> Evicts least recently used. Rapid adaptation, weak to scans.
                      </div>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                        <strong>LFU (Frequency):</strong> Evicts least frequently used. High stability, lacks decay aging.
                      </div>
                      <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                        <strong>SLRU / ARC / CLOCK:</strong> Segmented / adaptive multi-tier policies.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <style>{`
              @media (max-width: 768px) {
                div[style*="grid-template-columns: 58% 42%"] {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* Tab 2: Pollution & Scan Simulator */}
        {activeTab === 'pollution' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setScanScenario('naive')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: scanScenario === 'naive' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)',
                  background: scanScenario === 'naive' ? '#f8717118' : '#0c0e17',
                  color: scanScenario === 'naive' ? '#f87171' : 'var(--ifm-color-content-secondary)'
                }}
              >
                1. Naive LRU (No Admission Policy)
              </button>
              <button
                onClick={() => setScanScenario('tinylfu')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: scanScenario === 'tinylfu' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                  background: scanScenario === 'tinylfu' ? '#34d39918' : '#0c0e17',
                  color: scanScenario === 'tinylfu' ? '#34d399' : 'var(--ifm-color-content-secondary)'
                }}
              >
                2. W-TinyLFU (Frequency Admission Duel)
              </button>
            </div>

            <div style={{
              background: '#090b14',
              borderRadius: '10px',
              border: scanScenario === 'naive' ? '1px solid rgba(248, 113, 113, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)',
              padding: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: scanScenario === 'naive' ? '#f87171' : '#34d399', marginBottom: '10px' }}>
                {scanScenario === 'naive' ? 'Cache Pollution Disaster: Full Table Scan Attack' : 'Scan-Resistant Protection: TinyLFU Rejection'}
              </div>

              {scanScenario === 'naive' ? (
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  <p>
                    <strong>Midnight Batch Job:</strong> A background ETL analytics query executes a <span style={{ color: '#fbbf24' }}>SELECT * FROM orders</span> scanning 5,000,000 cold historical rows (<em>One-Hit Wonders</em>).
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #f87171' }}>
                      <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>ENTRANCE GATE</div>
                      <div>Wide open. Every junk row is admitted as "Most Recently Used".</div>
                    </div>
                    <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #f87171' }}>
                      <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>EVICTION CONSEQUENCE</div>
                      <div>Genuine hot <strong>Working Set is 100% flushed and evicted</strong>!</div>
                    </div>
                    <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #f87171' }}>
                      <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700 }}>NEXT MORNING RESULT</div>
                      <div>Active users return &rarr; Hit Ratio collapses to <strong>~0%</strong> &rarr; DB overload!</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                  <p>
                    <strong>Midnight Batch Job:</strong> The same full table scan attempts to insert 5,000,000 cold rows.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                      <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>ADMISSION DUEL</div>
                      <div>TinyLFU Count-Min Sketch shows scan row frequency = 1 vs hot item frequency = 45.</div>
                    </div>
                    <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                      <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>GATE 1 ACTION</div>
                      <div>Scan rows lose the duel and are immediately <strong>rejected at the gate</strong>.</div>
                    </div>
                    <div style={{ background: '#0c0e17', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                      <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>NEXT MORNING RESULT</div>
                      <div>The active Working Set remains 100% intact with <strong>99%+ Hit Ratio</strong>!</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: 3 Families of Eviction Policies */}
        {activeTab === 'families' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {/* Family 1: LRU */}
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '14px'
            }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                1. Recency-Based (LRU)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                • <strong>Core Philosophy:</strong> Temporal Locality (accessed recently &rarr; accessed again soon).<br />
                • <strong>Data Structure:</strong> HashMap + Doubly Linked List (`LinkedHashMap`).<br />
                • <strong>Blind Spot:</strong> Vulnerable to full table scans &amp; one-hit wonders.
              </div>
              <div style={{ background: '#090b14', padding: '6px 8px', borderRadius: '4px', fontSize: '10px', color: '#38bdf8' }}>
                Used in: Redis `allkeys-lru`, basic app caches
              </div>
            </div>

            {/* Family 2: LFU */}
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              padding: '14px'
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                2. Frequency-Based (LFU)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                • <strong>Core Philosophy:</strong> Historical Popularity (frequently queried items stay).<br />
                • <strong>Data Structure:</strong> HashMap + Frequency Bucket Lists (`O(1)` access).<br />
                • <strong>Blind Spot:</strong> Historical Bias / Lack of Decay (past viral keys never expire).
              </div>
              <div style={{ background: '#090b14', padding: '6px 8px', borderRadius: '4px', fontSize: '10px', color: '#fbbf24' }}>
                Used in: Redis `allkeys-lfu` (with log counter decay)
              </div>
            </div>

            {/* Family 3: Hybrid / Multi-Tier */}
            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              padding: '14px'
            }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                3. Hybrid / Multi-Tier (SLRU / ARC)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                • <strong>SLRU:</strong> Segmented into Probation (Trial) &amp; Protected (Official). Promotion requires 2nd hit.<br />
                • <strong>ARC:</strong> 4 lists with ghost metadata tracking.<br />
                • <strong>CLOCK:</strong> Circular buffer with 1-bit usage flags.
              </div>
              <div style={{ background: '#090b14', padding: '6px 8px', borderRadius: '4px', fontSize: '10px', color: '#34d399' }}>
                Used in: MySQL Buffer Pool, Postgres, Linux Kernel, Caffeine
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
