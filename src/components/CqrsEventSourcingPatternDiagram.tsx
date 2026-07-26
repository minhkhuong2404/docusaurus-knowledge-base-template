import React, { useState } from 'react';

export default function CqrsEventSourcingPatternDiagram() {
  const [activeStep, setActiveStep] = useState<'append' | 'replay'>('append');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>CQRS + Event Sourcing (Full Architectural Pattern)</span>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveStep('append')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: activeStep === 'append' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeStep === 'append' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeStep === 'append' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✍️ Append-Only Event Log Write Path
        </button>
        <button
          onClick={() => setActiveStep('replay')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: activeStep === 'replay' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: activeStep === 'replay' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeStep === 'replay' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          🔄 Event Replay &amp; Projection Read Path
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        {activeStep === 'append' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.3fr 1.5fr 0.3fr 1.2fr', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f87171' }}>Command Handler</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Validates Rules</div>
            </div>
            <div style={{ fontSize: '14px', color: '#f87171', fontWeight: 800 }}>→</div>
            <div style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid #f87171', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>EventStoreDB</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Immutable Append-Only Log</div>
            </div>
            <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 800 }}>→</div>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>Auditable Log</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>100% History</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.3fr 1.5fr 0.3fr 1.2fr', gap: '8px', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#f87171' }}>Event Store Stream</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Historical Events</div>
            </div>
            <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 800 }}>→</div>
            <div style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Event Projector</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Replays Events into Projection</div>
            </div>
            <div style={{ fontSize: '14px', color: '#34d399', fontWeight: 800 }}>→</div>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#34d399' }}>Read DB Projections</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Mongo / Elasticsearch</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {activeStep === 'append' ? (
          <span><strong>Append-Only Event Store:</strong> State is never mutated or overwritten. Writes append immutable domain events to the Event Store, guaranteeing a complete audit trail.</span>
        ) : (
          <span><strong>Event Replay &amp; Projections:</strong> Read models are generated on demand by replaying event history through projectors into specialized Read DB indexes.</span>
        )}
      </div>
    </div>
  );
}
