import React, { useState } from 'react';

export default function DsaWeek13Dp1dDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(3);

  // Climbing stairs / Fibonacci: dp[i] = dp[i-1] + dp[i-2]
  const dp = [1, 1, 2, 3, 5, 8];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          1D Dynamic Programming State Transition Graph
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setStep(s)} style={{ padding: '3px 8px', borderRadius: '5px', border: step === s ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', background: step === s ? 'rgba(167,139,250,0.2)' : 'transparent', color: step === s ? '#a78bfa' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              Step {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 140" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          <defs>
            <marker id="dp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
            </marker>
          </defs>

          {/* DAG State nodes */}
          {dp.map((val, i) => {
            const isTarget = i === step;
            const isDep1 = i === step - 1;
            const isDep2 = i === step - 2;
            return (
              <g key={`dp-${i}`} transform={`translate(${40 + i * 80}, 60)`}>
                <rect width="60" height="40" rx="8" fill={isTarget ? 'rgba(167,139,250,0.3)' : isDep1 || isDep2 ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)'} stroke={isTarget ? '#a78bfa' : isDep1 || isDep2 ? '#38bdf8' : 'rgba(255,255,255,0.1)'} strokeWidth={isTarget ? 2 : 1} />
                <text x="30" y="24" textAnchor="middle" fill={isTarget ? '#a78bfa' : '#ffffff'} fontSize="14" fontWeight="700">{i <= step ? val : '?'}</text>
                <text x="30" y="56" textAnchor="middle" fill="#64748b" fontSize="10">dp[{i}]</text>
              </g>
            );
          })}

          {/* Dependency curves */}
          {step >= 2 && (
            <>
              <path d={`M ${40 + (step - 1) * 80 + 30} 55 C ${40 + (step - 1) * 80 + 45} 25, ${40 + step * 80 + 15} 25, ${40 + step * 80 + 20} 55`} fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#dp-arrow)" />
              <path d={`M ${40 + (step - 2) * 80 + 30} 55 C ${40 + (step - 2) * 80 + 50} 5, ${40 + step * 80 + 10} 5, ${40 + step * 80 + 25} 55`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#dp-arrow)" />
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-purple" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px', marginBottom: '4px' }}>
          Transition Formula: dp[{step}] = dp[{step - 1}] ({dp[step - 1]}) + dp[{step - 2}] ({dp[step - 2]}) = {dp[step]}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Transforms exponential O(2^N) recursion into linear O(N) Time and O(1) Rolling Space.
        </div>
      </div>
    </div>
  );
}
