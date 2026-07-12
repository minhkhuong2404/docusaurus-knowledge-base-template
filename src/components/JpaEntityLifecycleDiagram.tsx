import React, { useState } from 'react';

interface StateInfo {
  title: string;
  dbRow: string;
  tracked: string;
  synced: string;
  role: string;
  details: string[];
  color: string;
}

const STATES_DATA: Record<string, StateInfo> = {
  TRANSIENT: {
    title: 'Transient State',
    dbRow: '❌ No row in database',
    tracked: '❌ Not tracked by EntityManager',
    synced: '❌ No auto-sync',
    role: 'A newly created object using "new" keyword that hasn\'t been associated with a persistence context yet.',
    details: [
      'Has no primary key identifier assigned yet (unless manually assigned).',
      'Exists purely in application heap memory.',
      'Saving changes to it will NOT affect the database unless saved/persisted.',
    ],
    color: '#38bdf8',
  },
  MANAGED: {
    title: 'Managed State',
    dbRow: '✅ Yes (or pending INSERT)',
    tracked: '✅ Yes (tracked by persistence context)',
    synced: '✅ Yes (on transaction commit/flush)',
    role: 'An entity instance associated with a Persistence Context (L1 Cache) which has a database representation.',
    details: [
      'Dirty checking tracks any property updates automatically.',
      'Hibernate flushes its dirty properties to database at transaction commit.',
      'Calling findById() returning managed references avoids duplicate database SELECT statements.',
    ],
    color: '#34d399',
  },
  DETACHED: {
    title: 'Detached State',
    dbRow: '✅ Yes',
    tracked: '❌ No longer tracked',
    synced: '❌ No auto-sync',
    role: 'An entity that has a database identity key, but its session has closed or it was manually evicted.',
    details: [
      'Created when the transaction/EntityManager commits or closes.',
      'Modifications to fields will NOT be auto-synced to the database.',
      'Can be brought back to MANAGED state using em.merge(entity).',
    ],
    color: '#a78bfa',
  },
  REMOVED: {
    title: 'Removed State',
    dbRow: '✅ Yes (pending DELETE)',
    tracked: '✅ Yes',
    synced: '✅ Yes (DELETE on flush)',
    role: 'An entity instance marked for deletion within the active transaction context.',
    details: [
      'Triggers when em.remove(entity) or repository.delete(entity) is called.',
      'Physical database DELETE statement is deferred until flush/commit.',
      'Removal can be canceled by calling em.persist(entity) before transaction flush.',
    ],
    color: '#f87171',
  },
};

export default function JpaEntityLifecycleDiagram(): React.JSX.Element {
  const [selectedState, setSelectedState] = useState<string>('MANAGED');

  const current = STATES_DATA[selectedState];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>JPA Entity Lifecycle States &amp; Transitions</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'center' }}>
        
        {/* SVG Diagram Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 340 280" className="interactive-diagram-svg">
            <defs>
              <marker id="state-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth="1.5" />
              </marker>
            </defs>

            {/* Transition Paths */}
            {/* Transient -> Managed */}
            <path id="t-trans-man" d="M 120 40 L 210 40" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-arr)"
                  className={selectedState === 'TRANSIENT' || selectedState === 'MANAGED' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />
            <text x="165" y="32" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">persist() / save()</text>

            {/* Managed -> Detached */}
            <path id="t-man-det" d="M 270 90 L 270 170" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-arr)"
                  className={selectedState === 'MANAGED' || selectedState === 'DETACHED' ? 'interactive-diagram-flowing-path active-path-purple' : ''} />
            <text x="280" y="135" textAnchor="start" fill="#64748b" fontSize="8" fontWeight="bold">detach() / close()</text>

            {/* Detached -> Managed */}
            <path id="t-det-man" d="M 250 170 L 250 90" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-arr)"
                  className={selectedState === 'DETACHED' || selectedState === 'MANAGED' ? 'interactive-diagram-flowing-path active-path-green' : ''} />
            <text x="242" y="135" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">merge()</text>

            {/* Managed -> Removed */}
            <path id="t-man-rem" d="M 210 75 L 70 175" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-arr)"
                  className={selectedState === 'MANAGED' || selectedState === 'REMOVED' ? 'interactive-diagram-flowing-path active-path-red' : ''} />
            <text x="130" y="115" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">remove()</text>

            {/* Removed -> Transient */}
            <path id="t-rem-trans" d="M 70 170 L 70 90" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-arr)"
                  className={selectedState === 'REMOVED' || selectedState === 'TRANSIENT' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />
            <text x="62" y="135" textAnchor="end" fill="#64748b" fontSize="8" fontWeight="bold">flush() (DELETE)</text>

            {/* Removed -> Managed */}
            <path id="t-rem-man" d="M 80 170 L 210 80" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" markerEnd="url(#state-arr)"
                  className={selectedState === 'REMOVED' || selectedState === 'MANAGED' ? 'interactive-diagram-flowing-path active-path-green' : ''} />
            <text x="160" y="160" textAnchor="start" fill="#64748b" fontSize="8" fontWeight="bold">persist() (cancel)</text>

            {/* Transient State Node */}
            <g onClick={() => setSelectedState('TRANSIENT')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="20" width="100" height="40" rx="8"
                    fill={selectedState === 'TRANSIENT' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'TRANSIENT' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="70" y="44" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="800">
                Transient
              </text>
            </g>

            {/* Managed State Node */}
            <g onClick={() => setSelectedState('MANAGED')} style={{ cursor: 'pointer' }}>
              <rect x="220" y="20" width="100" height="40" rx="8"
                    fill={selectedState === 'MANAGED' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'MANAGED' ? '#34d399' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="44" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">
                Managed
              </text>
            </g>

            {/* Detached State Node */}
            <g onClick={() => setSelectedState('DETACHED')} style={{ cursor: 'pointer' }}>
              <rect x="220" y="190" width="100" height="40" rx="8"
                    fill={selectedState === 'DETACHED' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'DETACHED' ? '#a78bfa' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="214" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="800">
                Detached
              </text>
            </g>

            {/* Removed State Node */}
            <g onClick={() => setSelectedState('REMOVED')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="190" width="100" height="40" rx="8"
                    fill={selectedState === 'REMOVED' ? 'rgba(248,113,113,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedState === 'REMOVED' ? '#f87171' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="70" y="214" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="800">
                Removed
              </text>
            </g>

            <text x="170" y="260" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on nodes to inspect state details.
            </text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0 }}>
            {current.role}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--ifm-color-content)' }}>
              {current.dbRow}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--ifm-color-content)' }}>
              {current.tracked}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--ifm-color-content)' }}>
              {current.synced}
            </span>
          </div>

          <ul style={{ margin: 0, paddingLeft: '14px' }}>
            {current.details.map((detail, idx) => (
              <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', lineHeight: 1.4 }}>
                {detail}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
