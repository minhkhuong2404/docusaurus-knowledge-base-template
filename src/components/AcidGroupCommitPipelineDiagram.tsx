import React, { useState } from 'react';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  leaderRole: string;
  followerRole: string;
  perfImpact: string;
}

const STAGES: PipelineStage[] = [
  { id: 'flush', name: '1. FLUSH Stage', color: '#38bdf8', leaderRole: 'Leader thread acquires Flush Mutex, collects WAL buffers from queue, writes to OS Page Cache.', followerRole: 'Follower threads register in Flush Queue and sleep on condition variable.', perfImpact: 'Combines multiple small buffer writes into a single batch write system call.' },
  { id: 'sync', name: '2. SYNC Stage', color: '#fbbf24', leaderRole: 'Leader thread acquires Sync Mutex, issues a single fsync(fd) system call for the entire batch.', followerRole: 'Followers wait silently while disk hardware sync completes.', perfImpact: 'Eliminates 99% of individual fsync() disk head / flash controller stalls.' },
  { id: 'commit', name: '3. COMMIT Stage', color: '#34d399', leaderRole: 'Leader thread acquires Commit Mutex, updates transaction commit statuses, notifies all followers.', followerRole: 'Followers wake up simultaneously and return COMMIT SUCCESS to clients.', perfImpact: 'Unlocks thousands of concurrent client threads simultaneously.' },
];

export default function AcidGroupCommitPipelineDiagram(): React.JSX.Element {
  const [selectedStageId, setSelectedStageId] = useState('flush');
  const [batchSize, setBatchSize] = useState(32);

  const stage = STAGES.find(s => s.id === selectedStageId) ?? STAGES[0];
  const totalIopsWithout = batchSize * 1000; // 1 fsync per txn
  const totalIopsWith = Math.round(batchSize * 1000 / batchSize); // 1 fsync per batch

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .gc-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          InnoDB Group Commit Lock-Free Pipeline Mechanism
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="gc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: 3-Stage Pipeline & Batch Slider */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '10px' }}>
              Select Pipeline Stage to Inspect
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {STAGES.map(s => {
                const isSel = selectedStageId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStageId(s.id)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isSel ? `${s.color}25` : 'rgba(255,255,255,0.03)',
                      color: isSel ? s.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: isSel ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            {/* Batch Size Throughput Calculator Slider */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Group Commit Batch Size:</span>
                <strong style={{ color: '#fbbf24' }}>{batchSize} Transactions / Batch</strong>
              </div>
              <input
                type="range"
                min="1"
                max="64"
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '10.5px' }}>
                <div style={{ background: 'rgba(248,113,113,0.15)', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ color: '#f87171', fontWeight: 700 }}>Individual fsync:</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)' }}>{totalIopsWithout.toLocaleString()} disk syncs/sec</div>
                </div>
                <div style={{ background: 'rgba(52,211,153,0.15)', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ color: '#34d399', fontWeight: 700 }}>Group Commit:</div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)' }}>{totalIopsWith.toLocaleString()} disk syncs/sec ({batchSize}x savings!)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Stage Roles Detail Card */}
          <div className={`interactive-diagram-details-card details-${stage.id === 'flush' ? 'blue' : stage.id === 'sync' ? 'yellow' : 'green'}`} style={{ minHeight: '220px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: stage.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Stage Detail: {stage.name}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              Leader vs Follower Threads
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
              <strong style={{ color: stage.color }}>Leader Thread: </strong>{stage.leaderRole}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ifm-color-content)' }}>Follower Threads: </strong>{stage.followerRole}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '10.5px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Throughput Optimization: </span>
              <strong style={{ color: stage.color }}>{stage.perfImpact}</strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
