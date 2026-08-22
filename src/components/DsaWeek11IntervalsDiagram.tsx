import React, { useState } from 'react';

export default function DsaWeek11IntervalsDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const rawIntervals = [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
    { start: 15, end: 18 }
  ];

  const steps = [
    { active: 0, merged: [{ start: 1, end: 3 }], desc: 'Sort by start time. Add [1, 3] to merged list.' },
    { active: 1, merged: [{ start: 1, end: 6 }], desc: '[2, 6] overlaps with [1, 3] (2 <= 3). Merge: new end = max(3, 6) = 6 → [1, 6].' },
    { active: 2, merged: [{ start: 1, end: 6 }, { start: 8, end: 10 }], desc: '[8, 10] starts after 6 (8 > 6). No overlap → Append [8, 10].' },
    { active: 3, merged: [{ start: 1, end: 6 }, { start: 8, end: 10 }, { start: 15, end: 18 }], desc: '[15, 18] starts after 10 (15 > 10). Append [15, 18]. Complete!' },
  ];

  const active = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Interval Merge & Timeline Overlap Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11px', cursor: 'pointer' }}>
            ⏮ Prev
          </button>
          <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step >= steps.length - 1} style={{ padding: '3px 8px', borderRadius: '5px', border: 'none', background: '#fbbf24', color: '#090b14', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            Next ⏭
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 140" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          {/* Timeline axis */}
          <line x1="30" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {[0, 3, 6, 9, 12, 15, 18].map((t) => (
            <g key={`time-${t}`} transform={`translate(${40 + t * 24}, 40)`}>
              <line y1="-4" y2="4" stroke="rgba(255,255,255,0.3)" />
              <text y="16" textAnchor="middle" fill="#64748b" fontSize="9">{t}</text>
            </g>
          ))}

          {/* Raw Intervals */}
          {rawIntervals.map((intv, idx) => {
            const isCur = idx === active.active;
            const x = 40 + intv.start * 24;
            const w = (intv.end - intv.start) * 24;
            return (
              <g key={`intv-${idx}`} transform={`translate(${x}, 55)`}>
                <rect width={w} height="20" rx="4" fill={isCur ? 'rgba(251,191,36,0.3)' : 'rgba(56,189,248,0.2)'} stroke={isCur ? '#fbbf24' : '#38bdf8'} />
                <text x={w / 2} y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">[{intv.start},{intv.end}]</text>
              </g>
            );
          })}

          {/* Merged Result */}
          <text x="30" y="105" fill="#34d399" fontSize="11" fontWeight="700">Merged:</text>
          {active.merged.map((m, idx) => {
            const x = 90 + m.start * 22;
            const w = (m.end - m.start) * 22;
            return (
              <g key={`m-${idx}`} transform={`translate(${x}, 92)`}>
                <rect width={Math.max(w, 40)} height="20" rx="4" fill="rgba(52,211,153,0.25)" stroke="#34d399" />
                <text x={Math.max(w, 40) / 2} y="14" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">[{m.start},{m.end}]</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-amber" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Sorting Step: O(N log N) → Linear Merge Scan: O(N). Total Time: O(N log N).
        </div>
      </div>
    </div>
  );
}
