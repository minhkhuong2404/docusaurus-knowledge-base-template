import React, { useState, useEffect, useRef } from 'react';

interface FlushLog {
  id: number;
  trigger: 'size' | 'time' | 'manual';
  count: number;
  timeStr: string;
}

export default function BatchingWritesDiagram(): React.JSX.Element {
  const [buffer, setBuffer] = useState<string[]>([]);
  const [history, setHistory] = useState<FlushLog[]>([]);
  const [timerMs, setTimerMs] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logIdCounter = useRef(0);

  const maxBatchSize = 5;
  const maxDelayMs = 150; // 150ms to make it human observable but fast

  // Flush function
  const flushBuffer = (trigger: 'size' | 'time' | 'manual', currentBuffer: string[]) => {
    if (currentBuffer.length === 0) return;
    
    logIdCounter.current += 1;
    const newLog: FlushLog = {
      id: logIdCounter.current,
      trigger,
      count: currentBuffer.length,
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(Date.now() % 1000).padStart(3, '0')
    };

    setHistory(prev => [newLog, ...prev].slice(0, 5));
    setBuffer([]);
    setTimerMs(0);
  };

  // Timer loop for time trigger
  useEffect(() => {
    if (isRunning && buffer.length > 0) {
      timerRef.current = setInterval(() => {
        setTimerMs(prev => {
          if (prev + 10 >= maxDelayMs) {
            flushBuffer('time', buffer);
            return 0;
          }
          return prev + 10;
        });
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerMs(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [buffer, isRunning]);

  const handleAddItem = () => {
    const newItem = `event-${Math.floor(Math.random() * 1000)}`;
    const nextBuffer = [...buffer, newItem];
    
    if (nextBuffer.length >= maxBatchSize) {
      flushBuffer('size', nextBuffer);
    } else {
      setBuffer(nextBuffer);
    }
  };

  const handleForceFlush = () => {
    flushBuffer('manual', buffer);
  };

  const progressPercent = Math.min((timerMs / maxDelayMs) * 100, 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span>Batching Writes Playground (Accumulator Pattern)</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .batch-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="batch-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Interactive Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Buffer visualizer */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--ifm-color-content)' }}>
                In-Memory Buffer ({buffer.length} / {maxBatchSize} items)
              </span>
              {buffer.length > 0 && (
                <span style={{ fontSize: '11px', color: '#fbbf24', animation: 'pulse 1s infinite' }}>
                  ⏳ Buffering...
                </span>
              )}
            </div>
            
            {/* Grid slots */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[0, 1, 2, 3, 4].map(idx => {
                const item = buffer[idx];
                const filled = !!item;
                return (
                  <div
                    key={idx}
                    style={{
                      height: '45px',
                      borderRadius: '8px',
                      border: filled ? '1.5px solid #2dd4bf' : '1px dashed rgba(255,255,255,0.1)',
                      background: filled ? 'rgba(45, 212, 191, 0.15)' : 'rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: '#2dd4bf',
                      transition: 'all 0.15s ease',
                      boxShadow: filled ? '0 0 6px rgba(45, 212, 191, 0.25)' : 'none'
                    }}
                  >
                    {filled ? item : 'empty'}
                  </div>
                );
              })}
            </div>

            {/* Time trigger timer bar */}
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                <span>Max Age Limit ({maxDelayMs}ms)</span>
                <span>{timerMs}ms</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: timerPercentToColor(progressPercent),
                    width: `${progressPercent}%`,
                    transition: 'width 0.05s linear'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddItem}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#2dd4bf',
                color: '#090b14',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(45, 212, 191, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              ➕ Add Write Event
            </button>
            <button
              onClick={handleForceFlush}
              disabled={buffer.length === 0}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: buffer.length === 0 ? 'rgba(255,255,255,0.2)' : 'var(--ifm-color-content)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: buffer.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ⚡ Flush Now
            </button>
          </div>
        </div>

        {/* Right Info and Logs Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Flush Logs Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="interactive-diagram-card-header" style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
                📥 Database Commit logs (Last 5)
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', justifyContent: history.length === 0 ? 'center' : 'flex-start' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                  No flushes yet. Click "Add Write Event" to begin buffering.
                </div>
              ) : (
                history.map(log => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${log.trigger === 'size' ? '#34d399' : log.trigger === 'time' ? '#fbbf24' : '#38bdf8'}`
                    }}
                  >
                    <div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: log.trigger === 'size' ? '#34d399' : log.trigger === 'time' ? '#fbbf24' : '#38bdf8',
                        textTransform: 'uppercase',
                        marginRight: '8px'
                      }}>
                        {log.trigger === 'size' ? 'Size Flush' : log.trigger === 'time' ? 'Time Flush' : 'Manual'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                        Flushed {log.count} items
                      </span>
                    </div>
                    <span style={{ fontSize: '9.5px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
                      {log.timeStr}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
        💡 **Accumulator Mechanics:** If you push events rapidly, the queue fills to **{maxBatchSize} items** and flushes via **Size Trigger** (Success rate: 1 DB call vs 5). If traffic slows down, the timer expires at **{maxDelayMs}ms** and flushes via **Time Trigger**, ensuring that latency is bounded even under low traffic.
      </div>
    </div>
  );
}

function timerPercentToColor(percent: number): string {
  if (percent < 50) return '#34d399';
  if (percent < 80) return '#fbbf24';
  return '#f87171';
}
