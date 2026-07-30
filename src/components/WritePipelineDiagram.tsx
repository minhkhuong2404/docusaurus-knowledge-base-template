import React, { useState } from 'react';

const STAGES = [
  {
    id: 'app',
    name: '1. Application Thread',
    latency: '< 1ms',
    color: '#38bdf8',
    work: 'Serialization (JSON/Java Objects), input validation, setting transaction context.',
    bottleneck: 'GC pauses, heavy reflection in serializers, CPU starvation.',
    remediation: 'Switch to binary formats (Protobuf/Avro), optimize garbage collection, reuse ObjectMapper.'
  },
  {
    id: 'orm',
    name: '2. SQL/ORM Layer',
    latency: '1 - 2ms',
    color: '#a78bfa',
    work: 'Connection acquisition, SQL parsing, query planning, object-relational mapping (dirty check).',
    bottleneck: 'HikariCP connection pool exhaustion, N+1 query generation.',
    remediation: 'Tune HikariCP max-pool-size, use sequence pre-allocation, batch inserts explicitly.'
  },
  {
    id: 'network',
    name: '3. Network Socket',
    latency: '0.5 - 5ms',
    color: '#f472b6',
    work: 'TCP handshake, TLS encryption overhead, packet routing to database server.',
    bottleneck: 'Physical distance (cross-region), TCP congestion, small packet overhead.',
    remediation: 'Co-locate application + DB in same AZ, enable connection pooling, keepalive flags.'
  },
  {
    id: 'buffer',
    name: '4. DB Process Buffer',
    latency: '< 0.1ms (RAM)',
    color: '#34d399',
    work: 'Writing changes to shared_buffers (Postgres) / Buffer Pool (InnoDB) in RAM.',
    bottleneck: 'Buffer pool saturation, dirty page eviction locks.',
    remediation: 'Allocate 25-40% system RAM to shared_buffers, tune bgwriter settings.'
  },
  {
    id: 'wal',
    name: '5. WAL / Redo Log',
    latency: '1 - 10ms',
    color: '#fbbf24',
    work: 'Appending change descriptions to the sequential Write-Ahead Log (pg_wal) buffer.',
    bottleneck: 'Disk queue length, sequential write speed limits.',
    remediation: 'Place WAL on dedicated high-speed NVMe drives, configure SSD write caching.'
  },
  {
    id: 'fsync',
    name: '6. fsync() OS Sync',
    latency: '2 - 15ms',
    color: '#f87171',
    work: 'Forcing OS page cache to flush log buffers directly onto physical non-volatile storage.',
    bottleneck: 'Physical disk IOPS, rotation delays, battery-backed cache saturation.',
    remediation: 'Set synchronous_commit = off for non-critical data, use hardware RAID caches.'
  },
  {
    id: 'tables',
    name: '7. Table Pages',
    latency: 'Deferred (Async)',
    color: '#2dd4bf',
    work: 'Flushing modified pages from buffer pool to heap files. Includes B-Tree index reorganizations.',
    bottleneck: 'Random I/O bottlenecks, cascading B-tree page splits, lock contention.',
    remediation: 'Increase checkpoint_timeout to spread writing load, partition large tables.'
  }
];

export default function WritePipelineDiagram(): React.JSX.Element {
  const [activeStage, setActiveStage] = useState<string>('app');

  const selected = STAGES.find(s => s.id === activeStage) || STAGES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Mental Model: The Write Pipeline</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .wp-grid-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="wp-grid-cols" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Pane - Stack View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STAGES.map(stage => {
            const isActive = stage.id === activeStage;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isActive ? `${stage.color}15` : 'rgba(255, 255, 255, 0.03)',
                  boxShadow: isActive ? `0 0 0 1.5px ${stage.color}50` : '0 0 0 1px rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    background: stage.color,
                    boxShadow: isActive ? `0 0 8px ${stage.color}` : 'none'
                  }} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: isActive ? stage.color : 'var(--ifm-color-content)'
                  }}>
                    {stage.name}
                  </span>
                </div>
                <code style={{
                  fontSize: '11px',
                  color: 'var(--ifm-color-content-secondary)',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {stage.latency}
                </code>
              </button>
            );
          })}
        </div>

        {/* Right Pane - Detail Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: selected.color }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>
              {selected.name}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>Work Done</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{selected.work}</p>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', fontWeight: 600, letterSpacing: '0.05em' }}>Bottleneck Danger</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{selected.bottleneck}</p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#34d399', fontWeight: 600, letterSpacing: '0.05em' }}>How to Optimize</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{selected.remediation}</p>
            </div>
          </div>
        </div>
      </div>
      <span className="interactive-diagram-helper-text">💡 Click any stage of the pipeline to see detailed profiles, latency, and how to optimize it.</span>
    </div>
  );
}
