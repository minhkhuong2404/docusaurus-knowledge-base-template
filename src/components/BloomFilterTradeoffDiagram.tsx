import React, { useState } from 'react';

export default function BloomFilterTradeoffDiagram(): React.JSX.Element {
  const [keysCount, setKeysCount] = useState<number>(300000); // n
  const [sizeMb, setSizeMb] = useState<number>(4); // m in MB

  // Calculate parameters
  const m = sizeMb * 8000000; // bits (approx 8 million bits per MB)
  const n = keysCount;
  
  // Optimal k
  const optimalK = Math.max(1, Math.round((m / n) * Math.log(2)));
  
  // False positive rate p
  const p = Math.pow(1 - Math.exp(-optimalK * n / m), optimalK);
  const pPct = p * 100;

  // Grade evaluation
  let gradeColor = '#34d399';
  let gradeText = 'Optimal 🟢 (Excellent shield)';
  if (pPct >= 1 && pPct < 5) {
    gradeColor = '#fbbf24';
    gradeText = 'Moderate 🟡 (Some collisions)';
  } else if (pPct >= 5) {
    gradeColor = '#f87171';
    gradeText = 'Degraded 🔴 (High collision risk)';
  }

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Bloom Filter Trade-off & Optimal Calculator</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .bft-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="bft-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Sliders Control Panel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Slider 1: Keys count n */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                <span>Number of Keys (n):</span>
                <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{keysCount.toLocaleString()} keys</span>
              </div>
              <input
                type="range"
                min="50000"
                max="1000000"
                step="50000"
                value={keysCount}
                onChange={e => setKeysCount(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            {/* Slider 2: Size in MB m */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                <span>Bit Array Size (m):</span>
                <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{sizeMb} MB ({m.toLocaleString()} bits)</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={sizeMb}
                onChange={e => setSizeMb(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#a78bfa' }}
              />
            </div>

          </div>
        </div>

        {/* Math results card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: gradeColor }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              📊 Mathematical Output
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Optimal Hashes (k):</span>
              <strong style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{optimalK} functions</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>False Positive Rate (p):</span>
              <strong style={{ color: gradeColor, fontFamily: 'monospace' }}>{pPct.toFixed(4)}%</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px' }}>
              <span>Filter Status:</span>
              <strong style={{ color: gradeColor }}>{gradeText}</strong>
            </div>

            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              💡 **Relationship Rule**: Increasing keys ($n$) without upgrading filter size ($m$) increases bit saturation, causing the false positive rate ($p$) to spike. Keep $m \approx 10$ bits per key for a steady $1\%$ error rate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
