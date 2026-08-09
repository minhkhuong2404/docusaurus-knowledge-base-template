import React, { useState } from 'react';

export default function DatabasePitrRecoveryDiagram(): React.JSX.Element {
  const [targetTimestamp, setTargetTimestamp] = useState<string>('10:44:59.999');
  const [stage, setStage] = useState<'idle' | 'restoring_base' | 'replaying_wal' | 'completed'>('idle');
  const [log, setLog] = useState<string>('PITR Engine ready. Select recovery timestamp to simulate continuous WAL replay.');

  const handleStartRecovery = () => {
    setStage('restoring_base');
    setLog('Step 1/3: Restoring physical Base Backup snapshot taken at 00:00:00...');
    
    setTimeout(() => {
      setStage('replaying_wal');
      setLog('Step 2/3: Replaying WAL segment logs continuously from 00:00:00 up to target timestamp ' + targetTimestamp + '...');
      
      setTimeout(() => {
        setStage('completed');
        setLog('✅ Step 3/3: PITR Recovery SUCCESSFUL! Database stopped WAL replay exactly at ' + targetTimestamp + ' — right before accidental DROP TABLE at 10:45:00.000!');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Point-In-Time Recovery (PITR) WAL Timeline Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Timeline Visualizer */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
            WAL Log Stream Timeline
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', fontSize: '12px', color: '#38bdf8', fontWeight: 700, flexShrink: 0 }}>
              00:00:00 (Base Backup)
            </div>
            <span style={{ color: 'var(--ifm-color-content-secondary)' }}>➔</span>
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', fontSize: '12px', color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
              Continuous WAL Segments
            </div>
            <span style={{ color: 'var(--ifm-color-content-secondary)' }}>➔</span>
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', fontSize: '12px', color: '#34d399', fontWeight: 700, flexShrink: 0 }}>
              Target: 10:44:59.999
            </div>
            <span style={{ color: 'var(--ifm-color-content-secondary)' }}>➔</span>
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(248, 113, 113, 0.2)', border: '1px solid #f87171', fontSize: '12px', color: '#f87171', fontWeight: 700, flexShrink: 0 }}>
              10:45:00 (DROP TABLE accident)
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={handleStartRecovery}
            disabled={stage !== 'idle' && stage !== 'completed'}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              backgroundColor: '#34d399',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: stage === 'idle' || stage === 'completed' ? 'pointer' : 'not-allowed',
              opacity: stage === 'idle' || stage === 'completed' ? 1 : 0.6,
            }}
          >
            {stage === 'idle' || stage === 'completed' ? '▶ Run PITR Recovery to 10:44:59.999' : '⏳ Recovery In Progress...'}
          </button>
        </div>

        {/* Log Output */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: 'var(--ifm-color-content)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {log}
        </div>
      </div>
    </div>
  );
}
