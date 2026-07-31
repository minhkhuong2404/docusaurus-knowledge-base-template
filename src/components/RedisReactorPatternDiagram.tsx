import React, { useState } from 'react';

export default function RedisReactorPatternDiagram(): React.JSX.Element {
  const [activeSocketCount, setActiveSocketCount] = useState<number>(4);
  const [processedCount, setProcessedCount] = useState<number>(1280);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [log, setLog] = useState<string>('Reactor Event Loop running. 100,000 idle client connections maintained via epoll().');

  const steps = [
    { num: 1, name: 'Client Network Sockets', desc: '100,000 concurrent client TCP sockets connected to Redis server.' },
    { num: 2, name: 'epoll() Syscall (Kernel)', desc: 'Linux kernel epoll() monitors all 100,000 sockets in O(1) time, returning ONLY sockets with active bytes.' },
    { num: 3, name: 'Event Loop Queue', desc: 'Active readable sockets are placed in a lightweight ready-event queue.' },
    { num: 4, name: 'Single-Threaded Execution', desc: 'Main thread pops ready events sequentially, reads RAM in nanoseconds, executes commands atomically, and writes responses.' },
  ];

  const handleSimulateBurst = () => {
    const active = Math.floor(Math.random() * 8) + 2;
    setActiveSocketCount(active);
    setProcessedCount((prev) => prev + active);
    setCurrentStep(4);
    setLog(`⚡ epoll() returned ${active} active ready sockets. Main thread processed all ${active} commands sequentially with zero lock contention!`);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Single-Threaded Reactor Pattern & epoll() I/O Multiplexing
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Step Indicator */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {steps.map((st) => {
            const isActive = st.num === currentStep;
            return (
              <div
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : '#0c0e17',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: isActive ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontWeight: 700 }}>
                  STEP {st.num}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: isActive ? '#fff' : 'var(--ifm-color-content)', marginTop: '2px' }}>
                  {st.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Detail Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #38bdf8', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
            {steps[currentStep - 1].name}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {steps[currentStep - 1].desc}
          </div>
        </div>

        {/* Interactive Simulation Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
              Active Socket Readiness (epoll)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
              {activeSocketCount} ready / 100,000 connected
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
              Total Executed Commands
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
              {processedCount.toLocaleString()} ops
            </div>
          </div>

          <button
            onClick={handleSimulateBurst}
            style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#38bdf8', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            ⚡ Trigger epoll Event Loop Tick
          </button>
        </div>

        {/* Log Box */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: 'var(--ifm-color-content)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {log}
        </div>
      </div>
    </div>
  );
}
