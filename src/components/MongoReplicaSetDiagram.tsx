import React, { useState } from 'react';

type WriteConcern = 'w1' | 'w_majority';

export default function MongoReplicaSetDiagram(): React.JSX.Element {
  const [writeConcern, setWriteConcern] = useState<WriteConcern>('w_majority');
  const [primaryStatus, setPrimaryStatus] = useState<'healthy' | 'crashed'>('healthy');
  const [electedPrimary, setElectedPrimary] = useState<'node1' | 'node2'>('node1');

  const handleSimulateCrash = () => {
    if (primaryStatus === 'healthy') {
      setPrimaryStatus('crashed');
      setElectedPrimary('node2');
    } else {
      setPrimaryStatus('healthy');
      setElectedPrimary('node1');
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          MongoDB Replica Set Architecture &amp; Failover Mechanics
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setWriteConcern('w1')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${writeConcern === 'w1' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
              background: writeConcern === 'w1' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.04)',
              color: writeConcern === 'w1' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              fontWeight: writeConcern === 'w1' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ⚡ WriteConcern.W1 (Fast)
          </button>
          <button
            onClick={() => setWriteConcern('w_majority')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${writeConcern === 'w_majority' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              background: writeConcern === 'w_majority' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: writeConcern === 'w_majority' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: writeConcern === 'w_majority' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            🛡️ WriteConcern.MAJORITY
          </button>
          <button
            onClick={handleSimulateCrash}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${primaryStatus === 'crashed' ? '#38bdf8' : '#f87171'}`,
              background: primaryStatus === 'crashed' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(248, 113, 113, 0.15)',
              color: primaryStatus === 'crashed' ? '#38bdf8' : '#f87171',
              fontWeight: 700,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            {primaryStatus === 'crashed' ? '🔄 Recover Primary' : '💥 Crash Primary'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 760 270" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="repl-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              <marker id="repl-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
              <marker id="repl-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
            </defs>

            {/* Client App */}
            <g transform="translate(30, 100)">
              <rect width="130" height="70" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="65" y="30" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Client Driver</text>
              <text x="65" y="50" textAnchor="middle" fill="#cbd5e1" fontSize="9">
                {writeConcern === 'w1' ? 'W: 1 (Primary ACK)' : 'W: MAJORITY ACK'}
              </text>
            </g>

            {/* NODE 1 (Original Primary) */}
            <g transform="translate(230, 20)">
              <rect
                width="200"
                height="80"
                rx="8"
                fill={primaryStatus === 'crashed' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)'}
                stroke={primaryStatus === 'crashed' ? '#f87171' : '#34d399'}
                strokeWidth={primaryStatus === 'crashed' ? 1.5 : 2}
                strokeDasharray={primaryStatus === 'crashed' ? '4 3' : 'none'}
              />
              <text x="100" y="28" textAnchor="middle" fill={primaryStatus === 'crashed' ? '#f87171' : '#34d399'} fontSize="13" fontWeight="800">
                {primaryStatus === 'crashed' ? 'Node 1 (CRASHED / DEAD)' : 'Node 1: PRIMARY'}
              </text>
              <text x="100" y="48" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">
                {primaryStatus === 'crashed' ? 'Heartbeat lost (election fired)' : 'Accepts writes ➔ oplog.rs'}
              </text>
              <text x="100" y="65" textAnchor="middle" fill="#86efac" fontSize="8.5">
                {primaryStatus === 'healthy' && (writeConcern === 'w1' ? '⚡ ACKs client immediately' : 'Waits for majority')}
              </text>
            </g>

            {/* NODE 2 (Secondary 1 or Promoted Primary) */}
            <g transform="translate(230, 160)">
              <rect
                width="200"
                height="80"
                rx="8"
                fill={primaryStatus === 'crashed' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(56, 189, 248, 0.12)'}
                stroke={primaryStatus === 'crashed' ? '#34d399' : '#38bdf8'}
                strokeWidth={primaryStatus === 'crashed' ? 2 : 1.5}
              />
              <text x="100" y="28" textAnchor="middle" fill={primaryStatus === 'crashed' ? '#34d399' : '#38bdf8'} fontSize="13" fontWeight="800">
                {primaryStatus === 'crashed' ? 'Node 2: NEW PRIMARY (Elected)' : 'Node 2: SECONDARY'}
              </text>
              <text x="100" y="48" textAnchor="middle" fill="#cbd5e1" fontSize="9.5">
                {primaryStatus === 'crashed' ? 'Won election via Arbiter vote' : 'Async oplog pull &amp; read queries'}
              </text>
              <text x="100" y="65" textAnchor="middle" fill={writeConcern === 'w_majority' && primaryStatus === 'healthy' ? '#34d399' : '#94a3b8'} fontSize="8.5" fontWeight={writeConcern === 'w_majority' ? '700' : 'normal'}>
                {primaryStatus === 'healthy' ? (writeConcern === 'w_majority' ? '✅ Acknowledges majority write' : 'Oplog sync behind primary') : 'Accepts incoming client writes'}
              </text>
            </g>

            {/* ARBITER (Voting only) */}
            <g transform="translate(530, 95)">
              <rect width="180" height="75" rx="8" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="90" y="28" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="700">ARBITER Node</text>
              <text x="90" y="48" textAnchor="middle" fill="#cbd5e1" fontSize="9">Zero Data / Zero Oplog</text>
              <text x="90" y="64" textAnchor="middle" fill="#fbbf24" fontSize="8.5">Holds 1 vote to break ties</text>
            </g>

            {/* Connection Paths */}
            {/* Client to Active Primary */}
            {primaryStatus === 'healthy' ? (
              <path d="M 160 125 L 222 75" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#repl-green)" className="interactive-diagram-flowing-path" />
            ) : (
              <path d="M 160 145 L 222 195" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#repl-green)" className="interactive-diagram-flowing-path" />
            )}

            {/* Primary to Secondary Replication */}
            {primaryStatus === 'healthy' && (
              <path d="M 330 100 L 330 152" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#repl-blue)" className="interactive-diagram-flowing-path" />
            )}

            {/* Arbiter Heartbeats / Votes */}
            <path d="M 430 60 L 522 110" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d="M 430 200 L 522 150" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <strong style={{ color: '#34d399', fontSize: '11px' }}>1. Oplog Replication:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              The Primary writes idempotent mutation events to <code>local.oplog.rs</code>. Secondaries tail this capped collection and replay changes to stay synchronized.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <strong style={{ color: '#38bdf8', fontSize: '11px' }}>2. Majority Quorum:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              In a 3-node set (Primary + Secondary + Arbiter), 2 votes form a strict majority. If the Primary crashes, Node 2 + Arbiter reach quorum and elect Node 2 in &lt;10s.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <strong style={{ color: '#fbbf24', fontSize: '11px' }}>3. Durability Trade-off:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              <code>w: 1</code> can lose committed writes if the Primary crashes before oplog reaches secondaries. <code>w: "majority"</code> guarantees zero rollbacks on failover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
