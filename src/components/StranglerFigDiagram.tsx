import React, { useState } from 'react';

interface MigrationPhase {
  phase: number;
  title: string;
  gatewayRule: string;
  monolithShare: string;
  microservicesShare: string;
  description: string;
  color: string;
}

const PHASES: MigrationPhase[] = [
  {
    phase: 1,
    title: 'Phase 1: Initial Monolith',
    gatewayRule: '/* → Legacy Monolith',
    monolithShare: '100%',
    microservicesShare: '0%',
    description: 'API Gateway routes 100% of incoming traffic to the legacy monolithic system. No microservices exist yet.',
    color: '#f87171',
  },
  {
    phase: 2,
    title: 'Phase 2: Extract First Feature (Order Svc)',
    gatewayRule: '/orders/* → Order Microservice, /* → Monolith',
    monolithShare: '80%',
    microservicesShare: '20%',
    description: 'First bounded context (Order Service) is extracted. Anti-Corruption Layer (ACL) shields new service from monolith database schemas.',
    color: '#fbbf24',
  },
  {
    phase: 3,
    title: 'Phase 3: Broad Migration',
    gatewayRule: '/orders/*, /users/*, /payments/* → Microservices',
    monolithShare: '30%',
    microservicesShare: '70%',
    description: 'Core domain services extracted. Contract tests and dual-write outbox patterns prevent data drift between old & new systems.',
    color: '#38bdf8',
  },
  {
    phase: 4,
    title: 'Phase 4: Monolith Retired',
    gatewayRule: '/* → Microservices Cluster',
    monolithShare: '0%',
    microservicesShare: '100%',
    description: 'The legacy monolith is completely strangled and decommissioned. All traffic flows cleanly to independent microservices.',
    color: '#34d399',
  },
];

export default function StranglerFigDiagram() {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState<number>(1); // Phase 2 default

  const current = PHASES[currentPhaseIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Strangler Fig Pattern — Incremental Monolith Migration
        </span>
      </div>

      {/* Interactive Phase Stepper */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {PHASES.map((p, idx) => (
          <button
            key={p.phase}
            onClick={() => setCurrentPhaseIdx(idx)}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11.5px',
              textAlign: 'center',
              background: currentPhaseIdx === idx ? `${p.color}20` : 'rgba(255,255,255,0.04)',
              color: currentPhaseIdx === idx ? p.color : 'var(--ifm-color-content-secondary)',
              boxShadow: currentPhaseIdx === idx ? `0 0 0 1.5px ${p.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            Phase {p.phase}
          </button>
        ))}
      </div>

      {/* Visual Migration Router */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: current.color }}>{current.title}</span>
          <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
            Gateway Routing Rule: {current.gatewayRule}
          </span>
        </div>

        {/* Traffic Distribution Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
            <span style={{ color: '#f87171' }}>Legacy Monolith: {current.monolithShare}</span>
            <span style={{ color: '#34d399' }}>Microservices: {current.microservicesShare}</span>
          </div>
          <div style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: current.monolithShare, background: '#f87171', transition: 'width 0.4s ease' }} />
            <div style={{ width: current.microservicesShare, background: '#34d399', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Topology Diagram */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 180px', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '12px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Client Traffic</div>
          </div>

          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ height: '2px', background: current.color, width: '100%' }} />
            <div style={{ fontSize: '10.5px', color: current.color, fontWeight: 700, marginTop: '4px' }}>API Gateway / Reverse Proxy</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              background: currentPhaseIdx === 3 ? 'rgba(255,255,255,0.03)' : 'rgba(248,113,113,0.12)',
              border: `1px solid ${currentPhaseIdx === 3 ? 'rgba(255,255,255,0.1)' : '#f87171'}`,
              padding: '10px', borderRadius: '8px', textAlign: 'center',
              opacity: currentPhaseIdx === 3 ? 0.3 : 1, transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f87171' }}>Legacy Monolith</div>
            </div>

            <div style={{
              background: currentPhaseIdx === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(52,211,153,0.12)',
              border: `1px solid ${currentPhaseIdx === 0 ? 'rgba(255,255,255,0.1)' : '#34d399'}`,
              padding: '10px', borderRadius: '8px', textAlign: 'center',
              opacity: currentPhaseIdx === 0 ? 0.3 : 1, transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399' }}>New Microservices</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {current.description}
      </div>
    </div>
  );
}
