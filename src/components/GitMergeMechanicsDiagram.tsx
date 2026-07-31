import React, { useState } from 'react';

export default function GitMergeMechanicsDiagram(): React.JSX.Element {
  const [mergeType, setMergeType] = useState<'ff' | 'no-ff' | 'three-way'>('ff');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="6" r="3"/>
          <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
          <line x1="6" y1="9" x2="6" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Merge Mechanics: Fast-Forward vs `--no-ff` vs 3-Way Merge Commit
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setMergeType('ff')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: mergeType === 'ff' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mergeType === 'ff' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Fast-Forward Merge
          </button>
          <button onClick={() => setMergeType('no-ff')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: mergeType === 'no-ff' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mergeType === 'no-ff' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Explicit `--no-ff` Merge
          </button>
          <button onClick={() => setMergeType('three-way')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: mergeType === 'three-way' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mergeType === 'three-way' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            3-Way Merge (Diverged)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {mergeType === 'ff' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Fast-Forward Merge</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>No new commits are created! `main` branch pointer simply slides forward to the latest feature commit. Linear history.</p>
            </div>
          )}
          {mergeType === 'no-ff' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>Explicit `--no-ff` Merge Commit</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Forces Git to create a dedicated merge commit (with 2 parents) even if fast-forwarding is possible. Preserves distinct feature branch history.</p>
            </div>
          )}
          {mergeType === 'three-way' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>3-Way Merge Commit</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Triggered when both `main` and `feature` have diverged. Uses the Best Common Ancestor commit + 2 branch tips to compute merge result.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
