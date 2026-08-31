import React, { useState } from 'react';

type FailoverMode = 'standby' | 'cold_restore';

export default function KafkaStreamsFailoverRecoveryDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<FailoverMode>('standby');
  const [changelogRecords, setChangelogRecords] = useState<number>(1000000); // 1M records
  const [replaySpeed] = useState<number>(500000); // 500k rec/sec

  const coldRestoreSecs = Math.max(1, Math.round(changelogRecords / replaySpeed));
  const standbySecs = 2; // Instant hot promotion

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-failover-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Failover Recovery & Standby Replica Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('standby')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: mode === 'standby' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
              color: mode === 'standby' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: mode === 'standby' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ Warm Failover (num.standby.replicas = 1)
          </button>
          <button
            onClick={() => setMode('cold_restore')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: mode === 'cold_restore' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
              color: mode === 'cold_restore' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              boxShadow: mode === 'cold_restore' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            ⏳ Cold Restore (No Standby Replicas)
          </button>
        </div>

        {/* Animated Flow SVG Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="fail-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="fail-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
              <marker id="fail-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
            </defs>

            {mode === 'standby' ? (
              <g>
                <rect x="25" y="15" width="160" height="50" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="105" y="37" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">Instance A (Primary)</text>
                <text x="105" y="53" textAnchor="middle" fill="#fca5a5" fontSize="9">💥 Crashes at t=0s</text>

                <rect x="25" y="85" width="160" height="50" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="105" y="107" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">Instance B (Standby Task)</text>
                <text x="105" y="123" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Maintains warm RocksDB copy</text>

                <line x1="185" y1="110" x2="280" y2="110" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="185" y1="110" x2="280" y2="110" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#fail-arr-green)" />

                <rect x="285" y="85" width="180" height="50" rx="8" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="375" y="107" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Instant Promotion (t ≈ 2s)</text>
                <text x="375" y="123" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Replay only last ~10 records</text>

                <line x1="465" y1="110" x2="535" y2="110" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="465" y1="110" x2="535" y2="110" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#fail-arr-green)" />

                <rect x="540" y="85" width="115" height="50" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="597" y="107" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">RUNNING</text>
                <text x="597" y="123" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">MTTR: ~2s</text>
              </g>
            ) : (
              <g>
                <rect x="25" y="45" width="140" height="60" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="95" y="70" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">1. Crash (t=0s)</text>
                <text x="95" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Session timeout (30s)</text>

                <line x1="165" y1="75" x2="235" y2="75" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                <line x1="165" y1="75" x2="235" y2="75" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#fail-arr-red)" />

                <rect x="240" y="45" width="160" height="60" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="320" y="70" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">2. Rebalance (t=30s)</text>
                <text x="320" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Task reassigned to Instance B</text>

                <line x1="400" y1="75" x2="475" y2="75" stroke="rgba(251,191,36,0.3)" strokeWidth="2" />
                <line x1="400" y1="75" x2="475" y2="75" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#fail-arr-amber)" />

                <rect x="480" y="45" width="175" height="60" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="567" y="70" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">3. Cold Changelog Replay</text>
                <text x="567" y="88" textAnchor="middle" fill="#fca5a5" fontSize="9">RESTORING for ~{coldRestoreSecs}s</text>
              </g>
            )}
          </svg>
        </div>

        {/* Calculation & Parameter Controls */}
        <div className="kstreams-failover-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
              RECOVERY TIME OBJECTIVE (RTO) CALCULATOR
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Changelog Records to Replay:</span>
                <span style={{ fontWeight: 800, color: '#fbbf24' }}>{(changelogRecords / 1000000).toFixed(1)}M Records</span>
              </div>
              <input
                type="range"
                min={100000}
                max={20000000}
                step={500000}
                value={changelogRecords}
                onChange={e => setChangelogRecords(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              <div>• Replay Throughput: <strong>~500,000 rec/sec</strong></div>
              <div>• Estimated MTTR: <strong style={{ color: mode === 'standby' ? '#34d399' : '#f87171' }}>{mode === 'standby' ? `~${standbySecs}s` : `~${coldRestoreSecs + 35}s`}</strong></div>
            </div>
          </div>

          <div className="interactive-diagram-details-card details-orange" style={{ minHeight: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
              ARCHITECTURAL TRADE-OFF
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
              {mode === 'standby' ? 'Standby Replicas: High Availability' : 'Cold Restore: Cost-Optimized'}
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: 0 }}>
              {mode === 'standby'
                ? 'Standby tasks run continuously in the background, consuming changelogs to keep their local RocksDB mirror fresh. On failover, promotion takes only 1-2 seconds with zero cluster disruption.'
                : 'Without standby replicas, when a node crashes, the new host starts with an empty disk. It must read the full changelog from Kafka brokers, blocking active processing until the restore finishes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
