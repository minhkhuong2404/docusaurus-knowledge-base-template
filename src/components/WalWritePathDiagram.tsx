import React, { useState } from 'react';

const STEPS = [
  {
    id: 1,
    title: '1. Log Append',
    desc: 'The database engine writes changes as a sequential entry to the WAL Buffer in RAM. This allocates a Log Sequence Number (LSN).',
    color: '#38bdf8'
  },
  {
    id: 2,
    title: '2. fsync() Log Commit',
    desc: 'The log records are flushed from volatile memory (WAL Buffer) to non-volatile disk blocks (pg_wal/). A hardware fsync() makes this durable.',
    color: '#fbbf24'
  },
  {
    id: 3,
    title: '3. Acknowledge Commit',
    desc: 'Once the WAL is confirmed flushed to disk, the server returns "COMMIT OK" to the client. The write is officially durable.',
    color: '#34d399'
  },
  {
    id: 4,
    title: '4. Async Checkpoint',
    desc: 'Later, in the background, the Checkpoint Process flushes modified table pages from the OS page cache / shared buffers to the actual heap table files.',
    color: '#a78bfa'
  }
];

export default function WalWritePathDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const selected = activeStep !== null ? STEPS[activeStep] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span>WAL Write Path & Checkpoint Flow</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          <defs>
            <marker id="wal-arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" /></marker>
            <marker id="wal-arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" /></marker>
            <marker id="wal-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" /></marker>
            <marker id="wal-arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" /></marker>
          </defs>

          {/* Client Node */}
          <g>
            <rect x="20" y="85" width="100" height="50" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="70" y="110" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">Client Thread</text>
            <text x="70" y="122" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">COMMIT</text>
          </g>

          {/* WAL Buffer Node (RAM) */}
          <g>
            <rect x="200" y="25" width="130" height="50" rx="6" fill="rgba(251, 191, 36, 0.08)" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="265" y="50" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="800">WAL Buffer</text>
            <text x="265" y="62" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">RAM (LSN Append)</text>
          </g>

          {/* WAL Segment Node (Disk) */}
          <g>
            <rect x="430" y="25" width="130" height="50" rx="6" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="1.5" />
            <text x="495" y="50" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">WAL Files (pg_wal)</text>
            <text x="495" y="62" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Non-Volatile Disk</text>
          </g>

          {/* Shared Buffers / OS Cache (RAM) */}
          <g>
            <rect x="200" y="145" width="130" height="50" rx="6" fill="rgba(167, 139, 250, 0.08)" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="265" y="170" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="800">Buffer Pool</text>
            <text x="265" y="182" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">RAM (Dirty Pages)</text>
          </g>

          {/* Heap Tables Node (Disk) */}
          <g>
            <rect x="430" y="145" width="130" height="50" rx="6" fill="rgba(167, 139, 250, 0.08)" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="495" y="170" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="800">Table Heap Pages</text>
            <text x="495" y="182" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Random I/O Disk</text>
          </g>

          {/* Paths */}
          {/* Step 1: Client -> WAL Buffer */}
          <path
            id="path-append"
            d="M 128 100 Q 160 60 192 60"
            fill="none"
            stroke={activeStep === 0 ? '#38bdf8' : 'rgba(255,255,255,0.1)'}
            strokeWidth={activeStep === 0 ? 2.5 : 1.2}
            markerEnd="url(#wal-arr-blue)"
            className={activeStep === 0 ? 'interactive-diagram-flowing-path' : ''}
          />
          {activeStep === 0 && (
            <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
              <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-append"/></animateMotion>
            </circle>
          )}

          {/* Step 2: WAL Buffer -> WAL Disk */}
          <path
            id="path-fsync"
            d="M 338 50 L 420 50"
            fill="none"
            stroke={activeStep === 1 ? '#fbbf24' : 'rgba(255,255,255,0.1)'}
            strokeWidth={activeStep === 1 ? 2.5 : 1.2}
            markerEnd="url(#wal-arr-amber)"
            className={activeStep === 1 ? 'interactive-diagram-flowing-path' : ''}
          />
          {activeStep === 1 && (
            <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
              <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-fsync"/></animateMotion>
            </circle>
          )}

          {/* Step 3: WAL Disk -> Client */}
          <path
            id="path-ack"
            d="M 430 45 Q 260 -5 120 80"
            fill="none"
            stroke={activeStep === 2 ? '#34d399' : 'rgba(255,255,255,0.1)'}
            strokeWidth={activeStep === 2 ? 2.5 : 1.2}
            markerEnd="url(#wal-arr-green)"
            className={activeStep === 2 ? 'interactive-diagram-flowing-path' : ''}
          />
          {activeStep === 2 && (
            <circle r="3" fill="#34d399" className="interactive-diagram-flowing-dot">
              <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-ack"/></animateMotion>
            </circle>
          )}

          {/* Step 4: Buffer Pool -> Heap Pages */}
          <path
            id="path-checkpoint"
            d="M 338 170 L 420 170"
            fill="none"
            stroke={activeStep === 3 ? '#a78bfa' : 'rgba(255,255,255,0.1)'}
            strokeWidth={activeStep === 3 ? 2.5 : 1.2}
            markerEnd="url(#wal-arr-purple)"
            className={activeStep === 3 ? 'interactive-diagram-flowing-path' : ''}
          />
          {activeStep === 3 && (
            <circle r="3" fill="#a78bfa" className="interactive-diagram-flowing-dot">
              <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-checkpoint"/></animateMotion>
            </circle>
          )}

          {/* Secondary implicit link: Client writing queries modifying data inside pool */}
          <path d="M 128 115 Q 160 170 192 170" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />

          {/* Checkpoint text tag */}
          <text x="379" y="193" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="bold">Checkpoint Thread</text>
        </svg>
      </div>

      {/* Button Steps Row */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {STEPS.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(activeStep === idx ? null : idx)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11.5px',
                background: isActive ? `${step.color}18` : 'rgba(255,255,255,0.03)',
                color: isActive ? step.color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${step.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}
            >
              {step.title}
            </button>
          );
        })}
      </div>

      {/* Info Card */}
      {selected ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: selected.color }}>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>
            {selected.desc}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '14px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
          Click one of the steps above to visualize the physical write flow.
        </div>
      )}
    </div>
  );
}
