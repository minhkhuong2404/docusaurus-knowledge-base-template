import React, { useState } from 'react';

type MigrationTab = 'consolidation' | 'shadow_cutover';

export default function DualWriteMigrationDiagram({ initialTab = 'consolidation' }: { initialTab?: MigrationTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MigrationTab>(initialTab);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [testScenario, setTestScenario] = useState<'success' | 'db_fail'>('success');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          ACID Consolidation & Zero-Downtime Dual-Write Migration
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'consolidation', label: '⚖️ Split-Brain vs ACID', color: '#f87171' },
            { id: 'shadow_cutover', label: '🚀 Dual-Write Cutover', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as MigrationTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: SPLIT-BRAIN VS CONSOLIDATION */}
        {activeTab === 'consolidation' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => setTestScenario('success')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${testScenario === 'success' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  background: testScenario === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: testScenario === 'success' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                Normal Flow (Both Succeed)
              </button>
              <button
                onClick={() => setTestScenario('db_fail')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${testScenario === 'db_fail' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  background: testScenario === 'db_fail' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: testScenario === 'db_fail' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                ⚠️ Non-Atomic Failure (DB Commit Crashes)
              </button>
            </div>

            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 760 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="split-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f87171" /></marker>
                  <marker id="split-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                  <marker id="split-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
                </defs>

                {/* Left Half: Split Architecture */}
                <g transform="translate(10, 10)">
                  <rect x="0" y="0" width="360" height="220" rx="8" fill="rgba(248, 113, 113, 0.05)" stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="180" y="24" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">❌ Fragile Split Architecture</text>

                  {/* App */}
                  <rect x="110" y="42" width="140" height="40" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.2)" />
                  <text x="180" y="66" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">App Coordinator</text>

                  {/* Redis Hold */}
                  <rect x="20" y="130" width="140" height="60" rx="6" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" />
                  <text x="90" y="152" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="700">Redis (Holds)</text>
                  <text x="90" y="172" textAnchor="middle" fill="#86efac" fontSize="9">Step 1: DECR stock ✅</text>

                  {/* MySQL Ledger */}
                  <rect x="200" y="130" width="140" height="60" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                  <text x="270" y="152" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">MySQL (Ledger)</text>
                  <text x="270" y="172" textAnchor="middle" fill={testScenario === 'db_fail' ? '#f87171' : '#86efac'} fontSize="9" fontWeight="700">
                    {testScenario === 'db_fail' ? 'Step 2: TIMEOUT 💥' : 'Step 2: Commit OK ✅'}
                  </text>

                  {/* Flow paths */}
                  <path d="M 140 82 L 90 125" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#split-red)" className="interactive-diagram-flowing-path" />
                  <path d="M 220 82 L 270 125" fill="none" stroke={testScenario === 'db_fail' ? '#f87171' : '#38bdf8'} strokeWidth="1.5" markerEnd={testScenario === 'db_fail' ? 'url(#split-red)' : 'url(#split-green)'} className="interactive-diagram-flowing-path" />

                  {testScenario === 'db_fail' && (
                    <text x="180" y="210" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="700">
                      🚨 Ghost hold in Redis! Inventory locked forever (Underselling).
                    </text>
                  )}
                </g>

                {/* Right Half: Consolidated ACID */}
                <g transform="translate(390, 10)">
                  <rect x="0" y="0" width="360" height="220" rx="8" fill="rgba(52, 211, 153, 0.05)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="180" y="24" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">✅ Unified ACID Consolidation</text>

                  {/* App */}
                  <rect x="110" y="42" width="140" height="40" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.2)" />
                  <text x="180" y="66" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">App Service</text>

                  {/* Consolidated RDBMS */}
                  <rect x="60" y="120" width="240" height="75" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.8" />
                  <text x="180" y="144" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="700">Single MySQL / Postgres Cluster</text>
                  <text x="180" y="162" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">BEGIN TRANSACTION</text>
                  <text x="180" y="178" textAnchor="middle" fill="#fef08a" fontSize="8.5">SELECT FOR UPDATE ➔ INSERT ledger ➔ COMMIT</text>

                  {/* Flow Path */}
                  <path d="M 180 82 L 180 115" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#split-green)" className="interactive-diagram-flowing-path" />

                  <text x="180" y="210" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="700">
                    🛡️ Atomicity Guaranteed: DB crash rolls back everything instantly!
                  </text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: SHADOW CUTOVER */}
        {activeTab === 'shadow_cutover' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={() => setPhase(1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: `1.5px solid ${phase === 1 ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: phase === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: phase === 1 ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Phase 1: Shadow Dual-Write (Redis Authoritative)
              </button>
              <button
                onClick={() => setPhase(2)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: `1.5px solid ${phase === 2 ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  background: phase === 2 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: phase === 2 ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Phase 2: Live Cutover (MySQL Authoritative + Fallback)
              </button>
            </div>

            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="cut-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                  <marker id="cut-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                  <marker id="cut-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#a78bfa" /></marker>
                </defs>

                {/* Application Box */}
                <g transform="translate(40, 70)">
                  <rect width="180" height="75" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="90" y="32" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Application Pod</text>
                  <text x="90" y="52" textAnchor="middle" fill="#cbd5e1" fontSize="9">Dual-Write Controller</text>
                </g>

                {/* Primary Store (Top Right) */}
                <g transform="translate(460, 20)">
                  <rect
                    width="260"
                    height="75"
                    rx="8"
                    fill={phase === 1 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)'}
                    stroke={phase === 1 ? '#38bdf8' : '#34d399'}
                    strokeWidth="2"
                  />
                  <text x="130" y="28" textAnchor="middle" fill={phase === 1 ? '#38bdf8' : '#34d399'} fontSize="12" fontWeight="800">
                    {phase === 1 ? '🔴 Redis (Active Primary Source)' : '🟢 MySQL (NEW Active Primary Source)'}
                  </text>
                  <text x="130" y="48" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">
                    Controls checkout decisions &amp; returns response
                  </text>
                  <text x="130" y="64" textAnchor="middle" fill="#86efac" fontSize="8.5">
                    100% Authoritative
                  </text>
                </g>

                {/* Secondary / Shadow Store (Bottom Right) */}
                <g transform="translate(460, 115)">
                  <rect
                    width="260"
                    height="75"
                    rx="8"
                    fill="rgba(167, 139, 250, 0.12)"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text x="130" y="28" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="700">
                    {phase === 1 ? '⚙️ MySQL (Shadow / Validation)' : '🛡️ Redis (Shadow / Kill Switch Fallback)'}
                  </text>
                  <text x="130" y="48" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">
                    {phase === 1 ? 'Validates lock behavior under real load' : 'Hot standby: instant rollback if anomaly occurs'}
                  </text>
                  <text x="130" y="64" textAnchor="middle" fill="#c4b5fd" fontSize="8.5">
                    {phase === 1 ? 'Async shadow writes' : 'Synchronized backup'}
                  </text>
                </g>

                {/* Arrows */}
                <path d="M 220 95 L 452 58" fill="none" stroke={phase === 1 ? '#38bdf8' : '#34d399'} strokeWidth="2.5" markerEnd={phase === 1 ? 'url(#cut-blue)' : 'url(#cut-green)'} className="interactive-diagram-flowing-path" />
                <path d="M 220 115 L 452 152" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#cut-purple)" className="interactive-diagram-flowing-path" />
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '11px' }}>1. Zero-Downtime Verification:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Shadow writes exercise MySQL indexing and locking algorithms under genuine multi-tenant production load before cutting over.
                </p>
              </div>

              <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <strong style={{ color: '#34d399', fontSize: '11px' }}>2. Instant Kill Switch:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  If MySQL p99 latency spikes during Black Friday flash sales, a feature flag dynamically reverts source-of-truth back to Redis in &lt;1 second.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
