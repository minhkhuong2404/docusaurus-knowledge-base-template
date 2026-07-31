import React, { useState } from 'react';

export default function GitPullRequestBestPracticesDiagram(): React.JSX.Element {
  const [prSize, setPrSize] = useState<number>(180);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Pull Request Size &amp; Code Review Quality Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#0c0e17', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
              PR Diff Size Filter:
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: prSize < 250 ? '#34d399' : prSize < 500 ? '#fbbf24' : '#f87171' }}>
              +{prSize} Lines Modified
            </div>
          </div>
          <input
            type="range"
            min="50"
            max="1200"
            step="50"
            value={prSize}
            onChange={(e) => setPrSize(parseInt(e.target.value))}
            style={{ width: '50%', cursor: 'pointer' }}
          />
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {prSize < 250 ? (
            <div style={{ color: '#34d399', fontSize: '12.5px', fontWeight: 700 }}>
              ✅ Optimal PR Size! Reviewers can thoroughly inspect code in ~15 minutes. High defect catch rate.
            </div>
          ) : prSize < 500 ? (
            <div style={{ color: '#fbbf24', fontSize: '12.5px', fontWeight: 700 }}>
              ⚠️ Moderate PR Size. Consider splitting refactoring from new feature logic.
            </div>
          ) : (
            <div style={{ color: '#f87171', fontSize: '12.5px', fontWeight: 700 }}>
              ❌ Unreviewable "Mega-PR"! Reviewers will rubber-stamp LGTM without spotting critical bugs. Split immediately!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
