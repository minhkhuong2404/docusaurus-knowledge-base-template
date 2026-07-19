import React, { useState } from 'react';

type RepMode = 'async' | 'sync' | 'logical';

export default function WalReplicationDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<RepMode>('async');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>WAL & Replication Architecture Modes</span>
      </div>

      {/* Tab controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['async', 'sync', 'logical'] as RepMode[]).map(t => {
          const isActive = mode === t;
          const label = t === 'async' ? 'Asynchronous' : t === 'sync' ? 'Synchronous (remote_apply)' : 'Logical (CDC)';
          const color = t === 'async' ? '#38bdf8' : t === 'sync' ? '#34d399' : '#a78bfa';
          return (
            <button
              key={t}
              onClick={() => setMode(t)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12.5px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Render selected mode */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ minHeight: '180px' }}>
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="rep-arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" /></marker>
            <marker id="rep-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" /></marker>
            <marker id="rep-arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" /></marker>
            <marker id="rep-arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" /></marker>
          </defs>

          {mode === 'async' && (
            <g>
              {/* Primary */}
              <rect x="50" y="60" width="130" height="60" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="115" y="88" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">Primary Node</text>
              <text x="115" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Writes WAL locally</text>

              {/* Standby */}
              <rect x="480" y="60" width="130" height="60" rx="6" fill="rgba(251, 191, 36, 0.08)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="545" y="88" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">Replica Node</text>
              <text x="545" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Asynchronously polls</text>

              {/* Streaming path */}
              <path id="async-stream" d="M 188 90 L 468 90" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#rep-arr-blue)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.5s" repeatCount="indefinite"><mpath href="#async-stream"/></animateMotion>
              </circle>
              <text x="329" y="80" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold">Background WAL Stream</text>

              {/* Immediate Ack to Client */}
              <path id="async-client-ack" d="M 115 50 C 115 10, 50 10, 50 40" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#rep-arr-green)" />
              <text x="80" y="25" fill="#34d399" fontSize="9.5" fontWeight="bold">COMMIT OK (Immediate)</text>
            </g>
          )}

          {mode === 'sync' && (
            <g>
              {/* Primary */}
              <rect x="50" y="60" width="130" height="60" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="115" y="88" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">Primary Node</text>
              <text x="115" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Waits for Standby</text>

              {/* Standby */}
              <rect x="480" y="60" width="130" height="60" rx="6" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="1.5" />
              <text x="545" y="88" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">Standby (Sync)</text>
              <text x="545" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Applies WAL & ACKs</text>

              {/* Fwd stream */}
              <path id="sync-fwd" d="M 188 80 L 468 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#rep-arr-blue)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#sync-fwd"/></animateMotion>
              </circle>
              
              {/* Return ACK */}
              <path id="sync-ack" d="M 480 100 L 200 100" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#rep-arr-green)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite" begin="0.6s"><mpath href="#sync-ack"/></animateMotion>
              </circle>
              <text x="329" y="115" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="bold">Replication ACK (Durability Guarantee)</text>

              {/* Final client commit response */}
              <path d="M 115 50 C 115 10, 50 10, 50 40" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#rep-arr-green)" />
              <text x="80" y="25" fill="#34d399" fontSize="9.5" fontWeight="bold">COMMIT OK (Blocked until ACK)</text>
            </g>
          )}

          {mode === 'logical' && (
            <g>
              {/* Primary */}
              <rect x="20" y="60" width="110" height="60" rx="6" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="75" y="88" textAnchor="middle" fill="#38bdf8" fontSize="11.5" fontWeight="800">Primary DB</text>
              <text x="75" y="101" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">wal_level = logical</text>

              {/* Logical Decoder */}
              <rect x="230" y="60" width="120" height="60" rx="6" fill="rgba(167, 139, 250, 0.08)" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="290" y="88" textAnchor="middle" fill="#a78bfa" fontSize="11.5" fontWeight="800">Logical Decoder</text>
              <text x="290" y="101" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">(Debezium / CDC)</text>

              {/* Kafka */}
              <rect x="490" y="60" width="140" height="60" rx="6" fill="rgba(251, 191, 36, 0.08)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="560" y="88" textAnchor="middle" fill="#fbbf24" fontSize="11.5" fontWeight="800">Kafka Broker</text>
              <text x="560" y="101" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">Change Event Queue</text>

              {/* Decodes WAL */}
              <path id="cdc-decode" d="M 138 90 L 222 90" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#rep-arr-purple)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#cdc-decode"/></animateMotion>
              </circle>

              {/* Publishes to Kafka */}
              <path id="cdc-publish" d="M 358 90 L 482 90" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#rep-arr-amber)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#cdc-publish"/></animateMotion>
              </circle>
            </g>
          )}
        </svg>
      </div>

      {/* Description Panel */}
      <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
        {mode === 'async' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>⚡ Asynchronous Replication Details</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Durability Tradeoff**: Client gets COMMIT OK immediately. WAL logs are streamed to standbys asynchronously.</li>
              <li>**Risk**: If the primary crashes before WAL is shipped, committed records are lost on replica promotion.</li>
              <li>**Use Case**: Ideal for scaling read-replicas or analytics ingestion where low latency is critical.</li>
            </ul>
          </div>
        )}
        {mode === 'sync' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>🔒 Synchronous Replication (remote_apply) Details</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Durability Guarantee**: Primary blocks the client commit response until Standby confirms log apply.</li>
              <li>**Tradeoff**: Significantly higher write latency since it incurs network round-trip overhead.</li>
              <li>**Use Case**: Mission-critical banking ledger transactional paths where zero-data-loss is mandatory.</li>
            </ul>
          </div>
        )}
        {mode === 'logical' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '4px' }}>🔄 Logical Change Data Capture (CDC) Details</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**CDC Mechanism**: Decodes binary WAL bytes into abstract relational row changes (INSERT/UPDATE/DELETE schemas).</li>
              <li>**Outbox Isolation**: Bypasses double-write issues by converting database state updates into an event stream.</li>
              <li>**Tradeoff**: Logical decoding increases WAL volume on primary by 20-30% (`wal_level = logical`).</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
