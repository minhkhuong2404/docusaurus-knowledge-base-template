import React, { useState } from 'react';

interface MigrationPhase {
  step: number;
  name: string;
  badge: string;
  color: string;
  description: string;
  appState: string;
  dbState: string;
}

const PHASES: MigrationPhase[] = [
  {
    step: 1,
    name: '1. Expand (Add New Column)',
    badge: 'Non-Blocking DDL',
    color: '#38bdf8',
    description: 'Add new column as NULLABLE (e.g. `ALTER TABLE users ADD COLUMN phone_v2 VARCHAR NULL;`). Zero lock time on modern databases.',
    appState: 'App V1: Reads & writes old `phone` column only.',
    dbState: 'Database: `phone` (existing), `phone_v2` (NULL for old rows).',
  },
  {
    step: 2,
    name: '2. Dual Write (App Release V2)',
    badge: 'Dual Writing',
    color: '#fbbf24',
    description: 'Deploy App V2: Any new or updated user row writes to BOTH `phone` and `phone_v2` simultaneously.',
    appState: 'App V2: Reads `phone`, writes to BOTH `phone` AND `phone_v2`.',
    dbState: 'Database: All new/updated rows have non-null values in both columns.',
  },
  {
    step: 3,
    name: '3. Asynchronous Backfill',
    badge: 'Background Migration',
    color: '#34d399',
    description: 'Background worker batch-migrates historical records (`UPDATE users SET phone_v2 = phone WHERE phone_v2 IS NULL LIMIT 1000;`).',
    appState: 'App V2: Continues dual writing.',
    dbState: 'Database: 100% of historical rows now backfilled into `phone_v2`.',
  },
  {
    step: 4,
    name: '4. Read Switch (App Release V3)',
    badge: 'Switch Read Path',
    color: '#c084fc',
    description: 'Deploy App V3: Switch application read traffic to `phone_v2`. Keep writing to both columns as safety rollback fallback.',
    appState: 'App V3: Reads `phone_v2`, writes BOTH `phone` AND `phone_v2`.',
    dbState: 'Database: `phone_v2` is primary read source.',
  },
  {
    step: 5,
    name: '5. Contract (Drop Old Column)',
    badge: 'Cleanup DDL',
    color: '#f87171',
    description: 'Deploy App V4 (writes only `phone_v2`), then execute DDL to drop old column (`ALTER TABLE users DROP COLUMN phone;`).',
    appState: 'App V4: Interacts exclusively with `phone_v2`.',
    dbState: 'Database: Old column `phone` safely dropped with ZERO downtime!',
  },
];

export default function SchemaMigrationLifecycleDiagram(): React.JSX.Element {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const activePhase = PHASES[activeStepIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Zero-Downtime Expand-Contract Schema Migration Lifecycle
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Step Selector Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '16px' }}>
          {PHASES.map((p, idx) => {
            const isSelected = idx === activeStepIndex;
            return (
              <button
                key={p.step}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${p.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '11.5px',
                  textAlign: 'center',
                }}
              >
                Step {p.step}
              </button>
            );
          })}
        </div>

        {/* Selected Phase Detail Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', borderLeft: `4px solid ${activePhase.color}`, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: activePhase.color }}>
              {activePhase.name}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${activePhase.color}22`, color: activePhase.color, fontWeight: 700 }}>
              {activePhase.badge}
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {activePhase.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: '#05070e', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Application State
              </div>
              <div style={{ fontSize: '12px', color: '#38bdf8' }}>{activePhase.appState}</div>
            </div>

            <div style={{ backgroundColor: '#05070e', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Database Table State
              </div>
              <div style={{ fontSize: '12px', color: '#34d399' }}>{activePhase.dbState}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
