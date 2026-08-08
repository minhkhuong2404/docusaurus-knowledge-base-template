import React, { useState } from 'react';

interface VisScenario {
  id: string;
  name: string;
  xmin: number;
  xmax: number;
  isVisible: boolean;
  color: string;
  pathDescription: string;
}

const SCENARIOS: VisScenario[] = [
  { id: 'committed_live', name: 'Tuple committed before snapshot (xmin=95, xmax=0)', xmin: 95, xmax: 0, isVisible: true, color: '#34d399', pathDescription: 'xmin (95) < Snapshot xmin (100) AND xmax=0. Tuple is fully committed and live.' },
  { id: 'inflight_xmin', name: 'Tuple created by active in-flight transaction (xmin=102)', xmin: 102, xmax: 0, isVisible: false, color: '#f87171', pathDescription: 'xmin (102) is present in active xip_list [102, 105]. Tuple is uncommitted to this snapshot.' },
  { id: 'future_xmin', name: 'Tuple created after snapshot was taken (xmin=110)', xmin: 110, xmax: 0, isVisible: false, color: '#fbbf24', pathDescription: 'xmin (110) >= Snapshot xmax (108). Tuple belongs to future transaction.' },
  { id: 'deleted_past', name: 'Tuple deleted by committed transaction before snapshot (xmin=95, xmax=98)', xmin: 95, xmax: 98, isVisible: false, color: '#f97316', pathDescription: 'xmin (95) committed, but xmax (98) also committed before snapshot xmin (100). Tuple is dead.' },
];

export default function AcidPgSnapshotVisibilityDiagram(): React.JSX.Element {
  const [selectedScenarioId, setSelectedScenarioId] = useState('committed_live');

  const sc = SCENARIOS.find(s => s.id === selectedScenarioId) ?? SCENARIOS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .pg-vis-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          PostgreSQL Snapshot Structure & Visibility Rule Flowchart
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="pg-vis-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Interactive Decision Tree Selector */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Tuple Execution Scenario
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SCENARIOS.map(s => {
                const isSel = selectedScenarioId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenarioId(s.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? s.color : 'var(--ifm-color-content)' }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Result: <strong style={{ color: s.color }}>{s.isVisible ? '✓ VISIBLE' : '✗ INVISIBLE'}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Flowchart Evaluation Output */}
          <div className={`interactive-diagram-details-card details-${sc.isVisible ? 'green' : 'red'}`} style={{ minHeight: '200px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: sc.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Snapshot Baseline: 100:108:102,105
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: sc.color, marginBottom: '8px' }}>
              {sc.isVisible ? '✓ TUPLE VISIBLE TO QUERY' : '✗ TUPLE INVISIBLE TO QUERY'}
            </div>
            <div style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
              Tuple Header: <code>xmin = {sc.xmin}</code> | <code>xmax = {sc.xmax}</code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {sc.pathDescription}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '10.5px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Rule Applied: </span>
              <strong style={{ color: sc.color }}>
                {sc.isVisible ? 'xmin committed < xmin(100) AND xmax uncommitted/live' : 'xmin in active xip_list OR xmin >= xmax(108) OR xmax committed'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
