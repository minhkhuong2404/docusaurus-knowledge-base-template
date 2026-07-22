import React, { useState } from 'react';

export default function SlidingWindowCounterDiagram() {
  const [elapsedSec, setElapsedSec] = useState<number>(18); // 18s elapsed = 70% overlap with prev window (42s left)
  const prevCount = 80;
  const currCount = 30;
  const limit = 100;

  const weight = (60 - elapsedSec) / 60;
  const estimatedCount = Math.round(prevCount * weight + currCount);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Sliding Window Counter Interpolation Simulator</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="counter-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .counter-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Controls & Math */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11.5px', marginBottom: '8px' }}>
            <strong style={{ color: '#a78bfa' }}>Elapsed Time in Current Window:</strong> {elapsedSec}s / 60s
          </div>

          <input
            type="range" min="0" max="60" value={elapsedSec}
            onChange={(e) => setElapsedSec(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
            <span>0s (100% Prev Weight)</span>
            <span>60s (0% Prev Weight)</span>
          </div>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: estimatedCount <= limit ? '#a78bfa40' : '#f8717140' }}>
          <h4 style={{ color: estimatedCount <= limit ? '#a78bfa' : '#f87171', margin: '0 0 4px 0', fontSize: '13px' }}>
            Interpolated Rate Check
          </h4>
          <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
            Previous Count $C_{'{prev}'} = 80$ (Weight: {(weight * 100).toFixed(0)}%)<br/>
            Current Count $C_{'{curr}'} = 30$<br/>
            <strong style={{ color: estimatedCount <= limit ? '#34d399' : '#f87171' }}>
              Estimated Count: ({prevCount} × {(weight).toFixed(2)}) + {currCount} = {estimatedCount} / {limit} {estimatedCount <= limit ? '✓ (APPROVED)' : '❌ (REJECTED)'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
