import React, { useState } from 'react';

const REFLOG_ENTRIES = [
  { id: 'e0', sha: 'a1b2c3d', action: 'HEAD@{0}: reset: moving to HEAD~1', color: '#f87171', detail: 'Accidental git reset --hard HEAD~1 performed. Commit e8f9a0 is detached but still exists in object DB for 90 days.' },
  { id: 'e1', sha: 'e8f9a0b', action: 'HEAD@{1}: commit: Add user auth', color: '#34d399', detail: 'Lost commit SHA-1: e8f9a0b. Can be recovered immediately by running: git checkout -b recovered-branch e8f9a0b or git reset --hard HEAD@{1}.' },
  { id: 'e2', sha: 'c4d5e6f', action: 'HEAD@{2}: checkout: moving from main to feat', color: '#38bdf8', detail: 'Branch checkout event recorded in .git/logs/HEAD.' },
];

export default function GitReflogSafetyDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>('e1');
  const selEntry = REFLOG_ENTRIES.find(e => e.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-ref-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Reflog Safety Net (.git/logs/HEAD)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-ref-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {REFLOG_ENTRIES.map(e => {
              const isActive = selected === e.id;
              return (
                <div key={e.id} onClick={() => setSelected(selected === e.id ? null : e.id)}
                  style={{ padding: '8px 12px', borderRadius: '7px', cursor: 'pointer', background: isActive ? `${e.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? e.color + '40' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s ease' }}>
                  <code style={{ fontSize: '11px', color: e.color, fontWeight: 700 }}>{e.sha}</code>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginLeft: '8px' }}>{e.action}</span>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            {selEntry ? (
              <div>
                <code style={{ fontSize: '12px', color: selEntry.color, fontWeight: 700, display: 'block', marginBottom: '6px' }}>{selEntry.action}</code>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{selEntry.detail}</p>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center' }}>Select a reflog entry</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
