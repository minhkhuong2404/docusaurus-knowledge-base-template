import React, { useState } from 'react';

export default function KafkaStreamsRebalanceStormDurationDiagram(): React.JSX.Element {
  const [numPods, setNumPods] = useState<number>(10);
  const [maxUnavailableMode, setMaxUnavailableMode] = useState<'one' | 'quarter' | 'half' | 'blue_green'>('one');
  const [stateSizeGb, setStateSizeGb] = useState<number>(20);
  const [selectedPhase, setSelectedPhase] = useState<'storm' | 'restore' | 'bluegreen'>('storm');

  // Calculations
  const secPerPodCycle = 35; // startup probe + grace period
  let rollingBatches = numPods;
  if (maxUnavailableMode === 'quarter') rollingBatches = Math.ceil(numPods / Math.max(1, Math.floor(numPods * 0.25)));
  if (maxUnavailableMode === 'half') rollingBatches = Math.ceil(numPods / Math.max(1, Math.floor(numPods * 0.5)));
  if (maxUnavailableMode === 'blue_green') rollingBatches = 0;

  const stormSecs = maxUnavailableMode === 'blue_green' ? 0 : rollingBatches * secPerPodCycle;
  const restoreSecs = Math.round((stateSizeGb * 1024) / 45); // ~45 MB/sec changelog replay
  const totalOutageSecs = stormSecs + restoreSecs;

  const formatTime = (secs: number) => {
    if (secs === 0) return '0 sec (Zero Downtime)';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-storm-calc-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Simulator: Rebalance Storm Duration & Outage Timeline
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Sliders & Configuration Row */}
        <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '12px' }}>
            DEPLOYMENT PARAMETERS & WORKLOAD SIZE
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Pod Count Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Pod Count (N<sub>pods</sub>):</span>
                <span style={{ fontWeight: 800, color: '#38bdf8' }}>{numPods} Pods</span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                value={numPods}
                onChange={e => setNumPods(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            {/* maxUnavailable Mode */}
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                Deployment Strategy:
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'one', label: 'Rolling (1 pod)' },
                  { id: 'quarter', label: 'Rolling (25%)' },
                  { id: 'blue_green', label: 'Blue-Green (app-v2)' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMaxUnavailableMode(m.id as any)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      background: maxUnavailableMode === m.id ? (m.id === 'blue_green' ? '#34d399' : '#f87171') : 'rgba(255,255,255,0.06)',
                      color: maxUnavailableMode === m.id ? '#090b14' : 'var(--ifm-color-content)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* State Size Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>RocksDB State Size:</span>
                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{stateSizeGb} GB / Store</span>
              </div>
              <input
                type="range"
                min={2}
                max={100}
                step={2}
                value={stateSizeGb}
                onChange={e => setStateSizeGb(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Interactive SVG Animation with Moving Arrows showing Storm Cycle vs Blue-Green Flow */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="storm-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
              <marker id="storm-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
              <marker id="storm-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
            </defs>

            {maxUnavailableMode !== 'blue_green' ? (
              <g>
                {/* Node 1: Pod Rolling */}
                <rect x="25" y="40" width="130" height="60" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="90" y="66" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">1. Pod v2 Starts</text>
                <text x="90" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Joins mixed group</text>

                {/* Moving Arrow 1 -> 2 */}
                <line x1="155" y1="70" x2="215" y2="70" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                <line x1="155" y1="70" x2="215" y2="70" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#storm-arr-red)" />

                {/* Node 2: Rebalance Trigger */}
                <rect x="220" y="40" width="140" height="60" rx="8" fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeWidth="1.5" />
                <text x="290" y="66" textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="700">2. Rebalance Fired</text>
                <text x="290" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Leader builds task map</text>

                {/* Moving Arrow 2 -> 3 */}
                <line x1="360" y1="70" x2="420" y2="70" stroke="rgba(249,115,22,0.3)" strokeWidth="2" />
                <line x1="360" y1="70" x2="420" y2="70" stroke="#f97316" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#storm-arr-amber)" />

                {/* Node 3: Task Clash & Loop */}
                <rect x="425" y="40" width="130" height="60" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="490" y="66" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">3. Task Crash</text>
                <text x="490" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">TaskAssignmentEx</text>

                {/* Return Loop Moving Arrow */}
                <path d="M 490 40 C 490 10, 90 10, 90 40" stroke="rgba(248,113,113,0.3)" strokeWidth="2" fill="none" />
                <path d="M 490 40 C 490 10, 90 10, 90 40" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#storm-arr-red)" />

                {/* Node 4: Final Wall */}
                <rect x="580" y="40" width="85" height="60" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="622" y="66" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">Restore</text>
                <text x="622" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Wall</text>
              </g>
            ) : (
              <g>
                <rect x="30" y="40" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="110" y="66" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">v1 Consumer Group</text>
                <text x="110" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">100% Live Throughput</text>

                <line x1="190" y1="70" x2="280" y2="70" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="190" y1="70" x2="280" y2="70" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#storm-arr-green)" />

                <rect x="285" y="40" width="180" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="375" y="66" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">v2 (app-v2) Background</text>
                <text x="375" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Parallel RocksDB Catchup</text>

                <line x1="465" y1="70" x2="545" y2="70" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="465" y1="70" x2="545" y2="70" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#storm-arr-green)" />

                <rect x="550" y="40" width="110" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="605" y="66" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">0s Downtime</text>
                <text x="605" y="83" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Instant Cutover</text>
              </g>
            )}
          </svg>
        </div>

        {/* Dynamic Outage Summary Card */}
        <div style={{
          background: maxUnavailableMode === 'blue_green' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border: maxUnavailableMode === 'blue_green' ? '1.5px solid #34d399' : '1.5px solid #f87171',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: maxUnavailableMode === 'blue_green' ? '#34d399' : '#f87171', textTransform: 'uppercase' }}>
                {maxUnavailableMode === 'blue_green' ? '✅ ZERO-DOWNTIME BLUE-GREEN MIGRATION' : '🚨 ESTIMATED TOTAL OUTAGE DURATION'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ifm-color-content)', marginTop: '2px' }}>
                {maxUnavailableMode === 'blue_green' ? '0s Active Downtime' : formatTime(totalOutageSecs)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '4px' }}>
                <span style={{ color: '#f87171', fontWeight: 700 }}>Phase 1 (Rebalance Storm): </span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{formatTime(stormSecs)}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '4px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>Phase 2 (State Restore): </span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{maxUnavailableMode === 'blue_green' ? 'Background (0s)' : formatTime(restoreSecs)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Timeline Bar */}
        <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
            OUTAGE TIMELINE PHASES (CLICK TO INSPECT)
          </div>

          <div style={{ display: 'flex', gap: '4px', height: '42px', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
            {maxUnavailableMode !== 'blue_green' ? (
              <>
                <div
                  onClick={() => setSelectedPhase('storm')}
                  style={{
                    flex: Math.max(1, stormSecs),
                    background: 'linear-gradient(90deg, #f87171, #ef4444)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#090b14',
                    fontWeight: 800,
                    fontSize: '11px',
                    padding: '0 8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPhase === 'storm' ? 'inset 0 0 0 2px #ffffff' : 'none'
                  }}
                >
                  Phase 1: Storm ({formatTime(stormSecs)})
                </div>
                <div
                  onClick={() => setSelectedPhase('restore')}
                  style={{
                    flex: Math.max(1, restoreSecs),
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#090b14',
                    fontWeight: 800,
                    fontSize: '11px',
                    padding: '0 8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedPhase === 'restore' ? 'inset 0 0 0 2px #ffffff' : 'none'
                  }}
                >
                  Phase 2: RocksDB Replay ({formatTime(restoreSecs)})
                </div>
              </>
            ) : (
              <div
                onClick={() => setSelectedPhase('bluegreen')}
                style={{
                  flex: 1,
                  background: 'linear-gradient(90deg, #34d399, #10b981)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#090b14',
                  fontWeight: 800,
                  fontSize: '12px',
                  boxShadow: selectedPhase === 'bluegreen' ? 'inset 0 0 0 2px #ffffff' : 'none'
                }}
              >
                Zero Downtime Cutover (v1 serves traffic while v2 restores in background)
              </div>
            )}
          </div>

          {/* Phase Details Card */}
          <div className="interactive-diagram-details-card details-orange" style={{ minHeight: '160px' }}>
            {selectedPhase === 'storm' && maxUnavailableMode !== 'blue_green' && (
              <>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '2px' }}>
                  PHASE 1: THE ROLLING REBALANCE STORM (0 MSG/SEC)
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: 'var(--ifm-color-content)' }}>
                  Active Mixed Cluster Conflict ({numPods} Pods Rolling)
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 6px 0' }}>
                  While at least one <code>v1</code> pod and one <code>v2</code> pod coexist, the leader's assignment clashes with follower topology definitions. Follower throws <code>TaskAssignmentException</code>, revoking partitions and triggering repeated rebalances.
                </p>
                <div style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 700 }}>
                  • Throughput: 0 records/sec • Consumer Lag: Accumulating rapidly on input topics.
                </div>
              </>
            )}

            {selectedPhase === 'restore' && maxUnavailableMode !== 'blue_green' && (
              <>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '2px' }}>
                  PHASE 2: THE STATE RESTORATION WALL (100% V2 REACHED)
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: 'var(--ifm-color-content)' }}>
                  Changelog Replay & State Store Reconstruction ({stateSizeGb} GB)
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 6px 0' }}>
                  The rebalance storm stops because all pods agree on <code>v2</code> task structure. However, because local <code>/0_0/</code> folders on disk contain old state from the swapped sub-topology, tasks enter <code>RESTORING</code> state to replay changelog records from Kafka.
                </p>
                <div style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 700 }}>
                  • Throughput: 0 input records processed until local RocksDB changelog catch-up completes.
                </div>
              </>
            )}

            {(selectedPhase === 'bluegreen' || maxUnavailableMode === 'blue_green') && (
              <>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '2px' }}>
                  BLUE-GREEN ZERO-DOWNTIME EXECUTION
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', color: 'var(--ifm-color-content)' }}>
                  Isolated Consumer Groups (application.id-v2)
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 6px 0' }}>
                  By incrementing <code>application.id</code>, <code>v2</code> runs as an independent consumer group. It builds state and replays changelogs in the background while <code>v1</code> processes production traffic at 100% throughput. Traffic is switched only when <code>v2</code> lag reaches 0.
                </p>
                <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700 }}>
                  • Active Outage: 0 seconds • Rebalance Storm Risk: Completely eliminated.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
