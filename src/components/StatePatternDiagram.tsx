import React, { useState } from 'react';

interface StateStep {
  id: string;
  name: string;
  badge: string;
  color: string;
  allowedActions: string;
  nextStateTransition: string;
  behavior: string;
}

const STATE_STEPS: StateStep[] = [
  {
    id: 'draft',
    name: '1. Draft State',
    badge: 'DRAFT',
    color: '#38bdf8', // Sky Blue
    allowedActions: 'edit(), render(), publish()',
    nextStateTransition: 'publish() -> Transitions Context to ModerationState',
    behavior: 'Document is editable by author. Rendering shows DRAFT watermark. Invoking publish() moves to moderation queue.'
  },
  {
    id: 'moderation',
    name: '2. Moderation State',
    badge: 'IN REVIEW',
    color: '#fbbf24', // Amber
    allowedActions: 'approve(), reject()',
    nextStateTransition: 'approve() -> Transitions to PublishedState | reject() -> Transitions back to DraftState',
    behavior: 'Document is locked for editing. Admin reviews content. Rejection sends back to Draft with review comments.'
  },
  {
    id: 'published',
    name: '3. Published State',
    badge: 'LIVE',
    color: '#34d399', // Emerald
    allowedActions: 'render(), expire()',
    nextStateTransition: 'expire() -> Transitions Context to ArchivedState',
    behavior: 'Document is publicly readable. Calling edit() throws StateException or triggers creation of new Draft.'
  }
];

export default function StatePatternDiagram() {
  const [activeId, setActiveId] = useState<string>('moderation');
  const currentState = STATE_STEPS.find(s => s.id === activeId) || STATE_STEPS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>State Design Pattern: Polymorphic State Machine Transitions</span>
      </div>

      {/* State Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {STATE_STEPS.map((s) => {
            const isActive = activeId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                style={{
                  background: isActive ? `${s.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? s.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: s.color, background: `${s.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {s.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {s.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: currentState.color, marginBottom: '4px' }}>
          {currentState.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {currentState.behavior}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: currentState.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Allowed State Methods
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {currentState.allowedActions}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              State Transition Target
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {currentState.nextStateTransition}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
