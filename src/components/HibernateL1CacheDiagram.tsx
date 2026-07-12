import React, { useState, useEffect } from 'react';

interface CacheStep {
  id: number;
  label: string;
  note: string;
  direction: 'right' | 'left' | 'none';
  color: string;
  cacheState: string;
  dbQuery: string;
  explanation: string;
}

const STEPS: CacheStep[] = [
  {
    id: 1,
    label: 'Transaction Starts',
    note: 'Persistence context created',
    direction: 'none',
    color: '#38bdf8',
    cacheState: '{} (Empty)',
    dbQuery: 'None',
    explanation: 'A new Hibernate session is opened. The Persistence Context (L1 cache) starts as an empty key-value map.',
  },
  {
    id: 2,
    label: 'em.find(User.class, 1L)',
    note: 'MISS -> Database query triggers',
    direction: 'right',
    color: '#fbbf24',
    cacheState: '1L -> { id: 1, name: "Alice", status: "CLEAN" }',
    dbQuery: 'SELECT * FROM users WHERE id = 1',
    explanation: 'Hibernate checks the L1 cache. It is a MISS, so Hibernate issues an SQL SELECT to the database, hydrates the entity, and stores it in the cache.',
  },
  {
    id: 3,
    label: 'em.find(User.class, 1L)',
    note: 'HIT -> Returns cached instance',
    direction: 'left',
    color: '#34d399',
    cacheState: '1L -> { id: 1, name: "Alice", status: "CLEAN" }',
    dbQuery: 'None (Bypassed)',
    explanation: 'Hibernate checks the L1 cache. It is a HIT! Hibernate returns the cached object reference immediately without hitting the database again.',
  },
  {
    id: 4,
    label: 'user.setName("Alice Updated")',
    note: 'Dirty check snapshot created',
    direction: 'none',
    color: '#a78bfa',
    cacheState: '1L -> { id: 1, name: "Alice Updated", status: "DIRTY" }',
    dbQuery: 'None (Buffered in memory)',
    explanation: 'Modifying the entity updates its state in JVM memory. Hibernate does not execute SQL immediately; the change is tracked as "dirty" in the persistence context.',
  },
  {
    id: 5,
    label: 'Transaction Commits / Flush',
    note: 'Dirty checks -> Issues SQL UPDATE',
    direction: 'right',
    color: '#f87171',
    cacheState: '1L -> { id: 1, name: "Alice Updated", status: "CLEAN" }',
    dbQuery: 'UPDATE users SET name = "Alice Updated" WHERE id = 1',
    explanation: 'During flush (pre-commit), Hibernate performs dirty checking by comparing active entities against their load-time snapshots. Since User 1 is dirty, it issues the SQL UPDATE statement to save changes to the database.',
  },
  {
    id: 6,
    label: 'Transaction Ends',
    note: 'Persistence context destroyed',
    direction: 'none',
    color: '#64748b',
    cacheState: 'None (Discarded)',
    dbQuery: 'COMMIT',
    explanation: 'The transaction commits successfully. The session closes, and the L1 cache is completely discarded from JVM memory.',
  },
];

export default function HibernateL1CacheDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!playing) return;
    if (activeStep >= STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(prev => prev + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [playing, activeStep]);

  const handlePlay = () => {
    setActiveStep(0);
    setPlaying(true);
  };

  const current = STEPS[activeStep];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span>Hibernate L1 Cache (First-Level Cache) Timeline</span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {playing ? 'Playing…' : 'Animate Flow'}
        </button>
      </div>

      {/* Main Flow Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Timeline column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '12px',
        }}>
          {STEPS.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.id}
                onClick={() => {
                  if (!playing) setActiveStep(idx);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: playing ? 'default' : 'pointer',
                  background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: `1.2px solid ${isSelected ? 'rgba(56,189,248,0.3)' : 'transparent'}`,
                  opacity: isSelected ? 1 : 0.4,
                  transition: 'all 0.2s',
                }}
              >
                {/* Step indicator circle */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  background: isSelected ? step.color : 'rgba(255,255,255,0.1)',
                  color: isSelected ? '#000' : 'var(--ifm-color-content)',
                }}>
                  {step.id}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    {step.note}
                  </div>
                </div>

                {step.direction !== 'none' && isSelected && (
                  <div style={{ fontSize: '14px', color: step.color, fontWeight: 'bold' }}>
                    {step.direction === 'right' ? '→ DB' : '← Cache'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* State details & Inspector */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
        }}>
          {/* L1 Cache Map State */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '12px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              L1 Cache (Persistence Context Map)
            </div>
            <code style={{ fontSize: '11px', display: 'block', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
              {current.cacheState}
            </code>
          </div>

          {/* Database Output */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '12px',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Database Activity (SQL execution)
            </div>
            <code style={{ fontSize: '11px', display: 'block', color: '#fbbf24', fontFamily: 'monospace' }}>
              {current.dbQuery}
            </code>
          </div>

          {/* Explanations text */}
          <div style={{ borderLeft: `3px solid ${current.color}`, paddingLeft: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Step Explanation
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              {current.explanation}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
