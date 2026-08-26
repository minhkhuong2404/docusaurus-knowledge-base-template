import React, { useState } from 'react';

type ExecViewMode = 'task_mapping' | 'event_loop';

export default function KafkaStreamsExecutionModelDiagram({ initialMode = 'task_mapping' }: { initialMode?: ExecViewMode }): React.JSX.Element {
  const [mode, setMode] = useState<ExecViewMode>(initialMode);
  const [instanceCount, setInstanceCount] = useState<number>(3); // 1, 2, 3, 6 instances
  const [activeLoopStep, setActiveLoopStep] = useState<number>(0);

  const loopSteps = [
    { step: '1. Poll Records', desc: 'StreamThread calls consumer.poll(100ms) fetching batches for all assigned task partitions.', color: '#38bdf8' },
    { step: '2. Route & Transform', desc: 'Record key/value deserialized and piped through processor DAG (filter, map, aggregate).', color: '#a78bfa' },
    { step: '3. State Store Update', desc: 'Updates written to in-memory write cache & RocksDB MemTable + append to WAL.', color: '#34d399' },
    { step: '4. Commit & Flush', desc: 'commit.interval.ms expires: flush write cache to RocksDB, send changelogs, commit consumer offsets.', color: '#fbbf24' }
  ];

  // Distribute 6 tasks across instances
  const totalTasks = 6;
  const getTasksForInstance = (instIdx: number, numInst: number): number[] => {
    const tasks: number[] = [];
    for (let t = 0; t < totalTasks; t++) {
      if (t % numInst === instIdx) {
        tasks.push(t);
      }
    }
    return tasks;
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-exec-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Streams Execution Model: Tasks, Threads & Processing Loop
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* View Switcher & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMode('task_mapping')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: mode === 'task_mapping' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: mode === 'task_mapping' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                boxShadow: mode === 'task_mapping' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              1. Task Parallelism & Instance Scaling
            </button>
            <button
              onClick={() => setMode('event_loop')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: mode === 'event_loop' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: mode === 'event_loop' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                boxShadow: mode === 'event_loop' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              2. StreamThread Record Processing Loop
            </button>
          </div>

          {mode === 'task_mapping' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Scale Instances:</span>
              {[1, 2, 3, 6].map(num => (
                <button
                  key={num}
                  onClick={() => setInstanceCount(num)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: instanceCount === num ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                    color: instanceCount === num ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  {num} {num === 1 ? 'Pod' : 'Pods'}
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === 'task_mapping' && (
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                Topic "orders-raw" (6 Partitions) ➔ 6 Stream Tasks
              </span>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                Max Parallelism = 6 (1 task per partition)
              </span>
            </div>

            {/* Instance Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${instanceCount}, 1fr)`, gap: '10px' }}>
              {Array.from({ length: instanceCount }).map((_, instIdx) => {
                const assignedTasks = getTasksForInstance(instIdx, instanceCount);
                return (
                  <div
                    key={instIdx}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      borderRadius: '6px',
                      padding: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>
                        Instance {String.fromCharCode(65 + instIdx)}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', background: '#38bdf822', color: '#38bdf8' }}>
                        {assignedTasks.length} {assignedTasks.length === 1 ? 'Task' : 'Tasks'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {assignedTasks.map(taskNum => (
                        <div
                          key={taskNum}
                          style={{
                            background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.2)',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                            Task 0_{taskNum} (Partition {taskNum})
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                            • Dedicated RocksDB store<br />
                            • Consumer Offset #{taskNum}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'event_loop' && (
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '10px' }}>
              StreamThread Processing Cycle (Continuous Loop)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {loopSteps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveLoopStep(idx)}
                  style={{
                    background: activeLoopStep === idx ? `${step.color}22` : 'rgba(255,255,255,0.02)',
                    border: activeLoopStep === idx ? `1.5px solid ${step.color}` : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: step.color, marginBottom: '4px' }}>
                    {step.step}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informational Footer Card */}
        <div className="interactive-diagram-details-card details-blue">
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
            PRODUCTION ARCHITECTURE INSIGHT
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
            <strong>Unit of Parallelism:</strong> In Kafka Streams, tasks (not threads or pods) are the atomic unit of work. Adding more instances than source topic partitions creates idle pods. Setting `num.stream.threads &gt; 1` allows a single pod with multi-core CPUs to process multiple tasks concurrently with independent RocksDB directories.
          </p>
        </div>
      </div>
    </div>
  );
}
