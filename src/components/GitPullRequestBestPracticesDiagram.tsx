import React, { useState } from 'react';

const ITEMS = [
  { id: 'pr1', text: 'Small PR size (< 400 lines changed for fast code review)' },
  { id: 'pr2', text: 'Clear title following Conventional Commits format' },
  { id: 'pr3', text: 'Descriptive PR template filled (Why, How, Testing Done)' },
  { id: 'pr4', text: 'All CI checks green (unit tests, linter, security scans)' },
  { id: 'pr5', text: 'Clean commit history (rebased on main, fixup commits squashed)' },
  { id: 'pr6', text: 'At least 1 approving review from code owner' },
];

export default function GitPullRequestBestPracticesDiagram(): React.JSX.Element {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));
  const count = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((count / ITEMS.length) * 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Pull Request &amp; Code Review Readiness Checklist ({pct}%)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#34d399', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ITEMS.map(item => {
            const isDone = !!checked[item.id];
            return (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '7px', cursor: 'pointer', background: isDone ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isDone ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s ease' }}>
                <span style={{ fontSize: '12px', color: isDone ? '#34d399' : 'var(--ifm-color-content-secondary)' }}>{isDone ? '✓' : '○'}</span>
                <span style={{ fontSize: '12px', color: 'var(--ifm-color-content)', textDecoration: isDone ? 'line-through' : 'none' }}>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
