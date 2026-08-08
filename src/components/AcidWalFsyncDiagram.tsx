import React, { useState } from 'react';

const PATH_STEPS = [
  { id: 1, name: '1. Write WAL Buffer', layer: 'User RAM', color: '#38bdf8', desc: 'Transaction constructs binary log record in wal_buffers with LSN offset.' },
  { id: 2, name: '2. Issue fsync()', layer: 'Kernel Storage Stack', color: '#fbbf24', desc: 'Engine calls fsync(fd) flushing OS Page Cache directly to storage controller.' },
  { id: 3, name: '3. Mark Page Dirty', layer: 'Buffer Pool RAM', color: '#a78bfa', desc: 'Data page in Buffer Pool is modified in RAM and tagged with page_lsn.' },
  { id: 4, name: '4. Acknowledge COMMIT', layer: 'Client App', color: '#34d399', desc: 'Client receives COMMIT SUCCESS response. Durability is fully achieved.' },
  { id: 5, name: '5. Async Checkpoint', layer: 'Data Files (.ibd)', color: '#2dd4bf', desc: 'Checkpointer daemon asynchronously flushes dirty pages (page_lsn <= flushed LSN) to storage files.' },
];

const STACK_LAYERS = [
  { name: 'Database App Buffer', desc: 'User Space RAM (wal_buffers / redo log buffer)', latency: '< 1 μs', color: '#38bdf8' },
  { name: 'OS Page Cache', desc: 'Kernel Space RAM (Dirty page cache buffers)', latency: '~ 1-5 μs (write)', color: '#a78bfa' },
  { name: 'Disk Controller Cache', desc: 'Volatile RAM Cache on NVMe/SATA Controller', latency: '~ 10-50 μs', color: '#fbbf24' },
  { name: 'Non-Volatile Storage', desc: 'Enterprise NAND Flash SSD with Power Loss Protection (PLP)', latency: '~ 0.5 - 2 ms (fsync)', color: '#34d399' },
];

export default function AcidWalFsyncDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'writepath' | 'kernelstack' | 'groupcommit'>('writepath');
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [batchSize, setBatchSize] = useState(32);

  // Group commit math calculation
  const fsyncLatencyMs = 1.0; // 1ms fsync
  const singleTps = 1000 / fsyncLatencyMs; // 1,000 TPS
  const groupTps = Math.round((batchSize * 1000) / (fsyncLatencyMs + 0.1));

  const step = PATH_STEPS[activeStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .wal-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Write-Ahead Logging (WAL), fsync() & Group Commit Engine
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('writepath')}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'writepath' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'writepath' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'writepath' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            5-Step Write Path
          </button>
          <button
            onClick={() => setActiveTab('kernelstack')}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'kernelstack' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'kernelstack' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'kernelstack' ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            OS Kernel Stack
          </button>
          <button
            onClick={() => setActiveTab('groupcommit')}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activeTab === 'groupcommit' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'groupcommit' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'groupcommit' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Group Commit Calculator
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeTab === 'writepath' && (
          <div className="wal-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            
            {/* Steps Timeline Selector */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '10px' }}>
                End-to-End Write Path Lifecycle
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PATH_STEPS.map((s, idx) => {
                  const isSel = activeStepIdx === idx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveStepIdx(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: isSel ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                        boxShadow: isSel ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? s.color : 'var(--ifm-color-content)' }}>{s.name}</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>Target Layer: {s.layer}</div>
                      </div>
                      <span style={{ fontSize: '12px', color: s.color, fontWeight: 700 }}>➔</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Detail Card */}
            <div className={`interactive-diagram-details-card details-${activeStepIdx === 0 ? 'blue' : activeStepIdx === 1 ? 'yellow' : activeStepIdx === 2 ? 'purple' : activeStepIdx === 3 ? 'green' : 'cyan'}`} style={{ minHeight: '200px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: step.color, textTransform: 'uppercase', marginBottom: '4px' }}>
                Stage {step.id} of 5
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {step.name}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
                {step.desc}
              </p>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '10px', fontSize: '11px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Durability Guarantee Status: </span>
                <strong style={{ color: activeStepIdx >= 1 ? '#34d399' : '#fbbf24' }}>
                  {activeStepIdx >= 1 ? 'Durably Flushed to Physical Disk' : 'In Volatile RAM Cache'}
                </strong>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'kernelstack' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
              Operating System Kernel Storage Stack Layering
            </div>
            {STACK_LAYERS.map((layer, idx) => (
              <div key={layer.name} style={{
                background: `${layer.color}10`,
                border: `1px solid ${layer.color}35`,
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: layer.color }}>
                    Layer {idx + 1}: {layer.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    {layer.desc}
                  </div>
                </div>
                <code style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', color: layer.color, fontWeight: 700 }}>
                  {layer.latency}
                </code>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'groupcommit' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '10px' }}>
              Group Commit Throughput Math Calculator
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '6px' }}>
                Batch Size (Concurrent Transactions Queued per fsync): <strong>{batchSize}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="128"
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>Individual Commit (No Batching)</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ifm-color-content)', margin: '4px 0' }}>
                  {singleTps.toLocaleString()} <span style={{ fontSize: '12px' }}>TPS</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>1 fsync per transaction (1ms limit)</div>
              </div>

              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>Group Commit (Batch = {batchSize})</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ifm-color-content)', margin: '4px 0' }}>
                  {groupTps.toLocaleString()} <span style={{ fontSize: '12px' }}>TPS</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                  {Math.round(groupTps / singleTps)}x Throughput Gain!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
