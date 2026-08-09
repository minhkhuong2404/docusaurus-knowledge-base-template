import React, { useState } from 'react';

export default function DatabaseReplicationQuorumDiagram(): React.JSX.Element {
  const [replicaCount, setReplicaCount] = useState<number>(5);
  const [writeQuorum, setWriteQuorum] = useState<number>(3);
  const [readQuorum, setReadQuorum] = useState<number>(3);
  const [log, setLog] = useState<string>('Quorum Simulator initialized. Strict Consistency Condition: R + W > N');

  const isStronglyConsistent = (readQuorum + writeQuorum) > replicaCount;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Leaderless Quorum Replication Simulator (R + W &gt; N)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Interactive Controls Sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Total Replicas (N)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{replicaCount}</div>
            <input
              type="range"
              min="3"
              max="9"
              value={replicaCount}
              onChange={(e) => setReplicaCount(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Write Quorum (W)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>{writeQuorum}</div>
            <input
              type="range"
              min="1"
              max={replicaCount}
              value={writeQuorum}
              onChange={(e) => setWriteQuorum(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '6px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Read Quorum (R)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{readQuorum}</div>
            <input
              type="range"
              min="1"
              max={replicaCount}
              value={readQuorum}
              onChange={(e) => setReadQuorum(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '6px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Quorum Inequality Evaluation Badge */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            backgroundColor: isStronglyConsistent ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
            border: isStronglyConsistent ? '1px solid #34d399' : '1px solid #f87171',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              Quorum Condition: R ({readQuorum}) + W ({writeQuorum}) = {readQuorum + writeQuorum} vs N ({replicaCount})
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: isStronglyConsistent ? '#34d399' : '#f87171', marginTop: '2px' }}>
              {isStronglyConsistent ? '✅ R + W > N : STRONG CONSISTENCY GUARANTEED' : '⚠️ R + W <= N : STALE READS POSSIBLE (EVENTUAL CONSISTENCY)'}
            </div>
          </div>
        </div>

        {/* Explanation Card */}
        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', backgroundColor: '#0c0e17', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', lineHeight: 1.5 }}>
          {isStronglyConsistent ? (
            <span>
              <strong>Why this is consistent:</strong> Because <code>R + W &gt; N</code> ({readQuorum + writeQuorum} &gt; {replicaCount}), the set of nodes read from and the set of nodes written to MUST overlap by at least 1 node. That node is guaranteed to hold the latest version tag, preventing stale reads.
            </span>
          ) : (
            <span>
              <strong>Why stale reads can happen:</strong> Because <code>R + W &lt;= N</code> ({readQuorum + writeQuorum} &lt;= {replicaCount}), a read request can hit a set of nodes that completely misses the nodes that received the latest write!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
