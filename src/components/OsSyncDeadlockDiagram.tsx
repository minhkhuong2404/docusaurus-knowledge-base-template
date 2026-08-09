import React, { useState, useEffect } from 'react';

const SCENARIOS = [
  {
    id: 'deadlock', label: 'Deadlock', color: '#f87171',
    overview: 'Deadlock: Process A holds Lock 1 and waits for Lock 2. Process B holds Lock 2 and waits for Lock 1. Neither can proceed — circular wait.',
    steps: [
      { actor: 'Process A', label: 'lock(mutex1)', color: '#38bdf8', dir: 'right', note: 'Process A acquires mutex1 successfully. Lock held.' },
      { actor: 'Process B', label: 'lock(mutex2)', color: '#34d399', dir: 'right', note: 'Process B acquires mutex2 successfully. Lock held.' },
      { actor: 'Process A', label: 'lock(mutex2) → BLOCKED', color: '#f87171', dir: 'right', note: 'Process A tries to acquire mutex2 — already held by B. A blocks and waits.' },
      { actor: 'Process B', label: 'lock(mutex1) → BLOCKED', color: '#f87171', dir: 'right', note: 'Process B tries to acquire mutex1 — already held by A. B blocks and waits. DEADLOCK! Circular wait formed.' },
    ],
    coffman: ['Mutual Exclusion: Resources cannot be shared', 'Hold & Wait: Process holds ≥1 resource while waiting', 'No Preemption: Resources cannot be forcibly taken', 'Circular Wait: P1→R1→P2→R2→P1 cycle'],
    prevention: ['Lock ordering: always acquire mutex1 before mutex2', 'tryLock() with timeout: ReentrantLock.tryLock(1s)', 'Deadlock detection: jstack / jcmd Thread.print', 'Single lock ordering (avoid nested locks)'],
  },
  {
    id: 'race', label: 'Race Condition', color: '#fbbf24',
    overview: 'Race condition: two threads read-modify-write a shared variable concurrently without synchronization. The final result depends on the non-deterministic execution order.',
    steps: [
      { actor: 'Thread 1', label: 'READ counter=0', color: '#38bdf8', dir: 'right', note: 'Thread 1 reads counter value 0 from memory into its CPU register.' },
      { actor: 'Thread 2', label: 'READ counter=0', color: '#34d399', dir: 'right', note: 'Thread 2 also reads counter=0. Both threads now hold the same stale value.' },
      { actor: 'Thread 1', label: 'counter=0+1=1, WRITE 1', color: '#fbbf24', dir: 'right', note: 'Thread 1 increments its register copy and writes 1 back to memory.' },
      { actor: 'Thread 2', label: 'counter=0+1=1, WRITE 1 ← LOST UPDATE!', color: '#f87171', dir: 'right', note: 'Thread 2 also increments its stale register copy (0+1=1) and overwrites memory with 1. One increment LOST! counter=1 instead of 2.' },
    ],
    coffman: ['Shared mutable state', 'Non-atomic read-modify-write', 'No synchronization mechanism', 'CPU register caching of memory values'],
    prevention: ['AtomicInteger.incrementAndGet() (CAS instruction)', 'synchronized block / ReentrantLock', 'volatile only for visibility, not atomicity', 'Prefer immutable data structures'],
  },
];

const PRIMITIVES = [
  { name: 'Mutex', color: '#38bdf8', detail: 'Binary lock: only the thread that acquired it can release it (ownership). Reentrant version allows same thread to lock multiple times. Java: synchronized or ReentrantLock.' },
  { name: 'Semaphore', color: '#34d399', detail: 'Counting semaphore: allows N concurrent accesses. acquire() decrements count. release() increments. No ownership. Java: Semaphore(N). Use for rate limiting or resource pool with N slots.' },
  { name: 'Monitor', color: '#a78bfa', detail: 'Mutex + condition variable combined. Thread waits on condition (Object.wait() / Condition.await()). Another thread signals (notify() / signal()). Java synchronized blocks are monitor-based.' },
  { name: 'SpinLock', color: '#fbbf24', detail: 'Busy-wait: thread loops checking lock in CPU register. Low latency for short critical sections (no context switch). Wastes CPU if lock held long. Used in kernel spinlocks for interrupt handlers.' },
];

export default function OsSyncDeadlockDiagram(): React.JSX.Element {
  const [scenario, setScenario] = useState<'deadlock' | 'race'>('deadlock');
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [selectedPrimitive, setSelectedPrimitive] = useState<string | null>('Mutex');

  const current = SCENARIOS.find(s => s.id === scenario)!;
  const prim = PRIMITIVES.find(p => p.name === selectedPrimitive) ?? null;

  useEffect(() => {
    if (!playing || animStep >= current.steps.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 950);
    return () => clearTimeout(t);
  }, [playing, animStep, current.steps.length]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };
  const handleScenarioChange = (s: 'deadlock' | 'race') => { setScenario(s); setActiveStep(null); setAnimStep(0); setPlaying(false); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .os-sync-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Synchronization, Deadlock &amp; Race Conditions</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : `rgba(248,113,113,0.15)`, color: playing ? 'var(--ifm-color-content-secondary)' : '#f87171', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(248,113,113,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => handleScenarioChange(s.id as 'deadlock' | 'race')}
              style={{ flex: 1, padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', background: scenario === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)', color: scenario === s.id ? s.color : 'var(--ifm-color-content-secondary)', boxShadow: scenario === s.id ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {s.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{current.overview}</p>

        <div className="os-sync-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          {/* Steps */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Execution Sequence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.steps.map((step, i) => {
                const isActive = activeStep !== null && i <= activeStep;
                const isCurrent = activeStep === i;
                return (
                  <div key={i} onClick={() => setActiveStep(activeStep === i ? null : i)}
                    style={{ cursor: 'pointer', opacity: isActive ? 1 : activeStep !== null ? 0.22 : 0.7, transition: 'opacity 0.4s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: step.color, minWidth: '16px', paddingTop: '2px' }}>{i + 1}</span>
                      <div style={{ flex: 1, background: isActive ? `${step.color}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? step.color + '35' : 'rgba(255,255,255,0.07)'}`, borderRadius: '7px', padding: '7px 10px', transition: 'all 0.3s ease' }}>
                        <code style={{ fontSize: '10.5px', color: step.color, fontWeight: 700 }}>{step.actor}: {step.label}</code>
                        {isCurrent && <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{step.note}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditions + Prevention */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{scenario === 'deadlock' ? 'Coffman Conditions' : 'Root Causes'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {current.coffman.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '7px', background: `${current.color}08`, border: `1px solid ${current.color}20`, borderRadius: '6px', padding: '6px 9px' }}>
                    <span style={{ color: current.color, fontSize: '11px' }}>⚠</span>
                    <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Prevention</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {current.prevention.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '7px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '6px', padding: '6px 9px' }}>
                    <span style={{ color: '#34d399', fontSize: '11px' }}>✓</span>
                    <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Synchronization primitives */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Synchronization Primitives</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {PRIMITIVES.map(p => (
              <button key={p.name} onClick={() => setSelectedPrimitive(selectedPrimitive === p.name ? null : p.name)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: selectedPrimitive === p.name ? `${p.color}18` : 'rgba(255,255,255,0.04)', color: selectedPrimitive === p.name ? p.color : 'var(--ifm-color-content-secondary)', boxShadow: selectedPrimitive === p.name ? `0 0 0 1.5px ${p.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
                {p.name}
              </button>
            ))}
          </div>
          {prim && (
            <div style={{ background: `${prim.color}0d`, border: `1px solid ${prim.color}30`, borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{prim.detail}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}