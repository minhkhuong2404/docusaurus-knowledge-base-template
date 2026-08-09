import React, { useState } from 'react';

export default function AcidUndoStoragePurgeDiagram(): React.JSX.Element {
  const [purgeMode, setPurgeMode] = useState<'normal' | 'blocked'>('normal');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .undo-storage-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Undo Tablespace Architecture & Purge Subsystem
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setPurgeMode('normal')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: purgeMode === 'normal' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
              color: purgeMode === 'normal' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: purgeMode === 'normal' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Normal Purge (Active)
          </button>
          <button
            onClick={() => setPurgeMode('blocked')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: purgeMode === 'blocked' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
              color: purgeMode === 'blocked' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              boxShadow: purgeMode === 'blocked' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Blocked Purge (Stale Snapshot)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="undo-storage-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Storage Graph */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', marginBottom: '12px' }}>
              Buffer Pool Page vs Rollback Segment Tablespaces
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              
              {/* Buffer Pool Card */}
              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1.5px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Buffer Pool Page</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Row: id=1, balance=400</div>
                <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '4px' }}>DB_TRX_ID: 200</div>
                <div style={{ fontSize: '10px', color: '#2dd4bf' }}>DB_ROLL_PTR ➔ Undo Slot #42</div>
              </div>

              {/* Undo Tablespace Card */}
              <div style={{ background: 'rgba(45,212,191,0.1)', border: '1.5px solid rgba(45,212,191,0.3)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf', marginBottom: '4px' }}>Undo Tablespace (undo001)</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Rollback Segment Slot #42</div>
                <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '4px' }}>Before-Image: balance=500</div>
                <div style={{ fontSize: '10px', color: purgeMode === 'normal' ? '#34d399' : '#f87171', fontWeight: 700, marginTop: '4px' }}>
                  {purgeMode === 'normal' ? 'Status: Purged & Reclaimed' : 'Status: Retained (Locked by ReadView)'}
                </div>
              </div>

            </div>

            {/* Purge Subsystem Flow Note */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '8px 10px', fontSize: '10.5px' }}>
              <span style={{ color: '#2dd4bf', fontWeight: 700 }}>Purge Threads Daemon: </span>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>
                {purgeMode === 'normal'
                  ? 'Continuously frees undo log segments once no active ReadView references them.'
                  : 'Stale long-running transaction holds oldest ReadView active. Purge daemon is frozen.'}
              </span>
            </div>
          </div>

          {/* Right: Storage Details & Impact Panel */}
          <div className={`interactive-diagram-details-card details-${purgeMode === 'normal' ? 'teal' : 'red'}`} style={{ minHeight: '190px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: purgeMode === 'normal' ? '#2dd4bf' : '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
              Subsystem Mode: {purgeMode === 'normal' ? 'HEALTHY GARBAGE COLLECTION' : 'PURGE THREAD LAG / BLOAT'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              {purgeMode === 'normal' ? 'Optimal Undo Tablespace Maintenance' : 'Long-Running Transaction Bloat Risk'}
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {purgeMode === 'normal'
                ? 'Undo records created by committed transactions are reclaimed rapidly once all older read views close. Keeps tablespace size small.'
                : 'A reporting query opened 3 hours ago holds an active snapshot. Undo history list length spikes into millions, bloating disk space and slowing point-in-time reads.'}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '10.5px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Actionable Defense: </span>
              <strong style={{ color: purgeMode === 'normal' ? '#34d399' : '#f87171' }}>
                {purgeMode === 'normal' ? 'Keep short transactions' : 'Set idle_in_transaction_session_timeout or kill stale sessions'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
