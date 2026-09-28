import React, { useState } from 'react';

type Scenario = 'success' | 'timeout';

export default function SqsVisibilityTimeoutDiagram(): React.JSX.Element {
  const [scenario, setScenario] = useState<Scenario>('success');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Amazon SQS: Visibility Timeout & Duplicate Processing Mechanics
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setScenario('success')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${scenario === 'success' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              background: scenario === 'success' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: scenario === 'success' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: scenario === 'success' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ✅ Successful Ack (DeleteMessage &lt; 30s)
          </button>
          <button
            onClick={() => setScenario('timeout')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${scenario === 'timeout' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
              background: scenario === 'timeout' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.04)',
              color: scenario === 'timeout' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              fontWeight: scenario === 'timeout' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ⚠️ Timeout Expiry (Duplicate Delivery)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          {scenario === 'success' ? (
            <svg viewBox="0 0 760 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="sqs-arr-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
                <marker id="sqs-arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
              </defs>

              {/* Producer */}
              <g transform="translate(30, 80)">
                <rect width="110" height="50" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="55" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Producer</text>
                <text x="55" y="40" textAnchor="middle" fill="#94a3b8" fontSize="9">SendMessage</text>
              </g>

              {/* SQS Queue */}
              <g transform="translate(240, 50)">
                <rect width="240" height="110" rx="8" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="120" y="26" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="800">SQS Queue</text>
                
                {/* Message in Queue */}
                <rect x="25" y="42" width="190" height="50" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="120" y="62" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Msg #101 [ReceiptHandle]</text>
                <text x="120" y="78" textAnchor="middle" fill="#86efac" fontSize="9">Visibility Timeout Clock: 30s ⏱️</text>
              </g>

              {/* Consumer 1 */}
              <g transform="translate(580, 80)">
                <rect width="140" height="50" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                <text x="70" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Consumer Instance 1</text>
                <text x="70" y="38" textAnchor="middle" fill="#86efac" fontSize="9">Processed in 12s ✅</text>
              </g>

              {/* Directed Arrows */}
              <path d="M 140 105 L 235 105" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#sqs-arr-blue)" className="interactive-diagram-flowing-path" />
              <path d="M 480 85 L 575 85" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#sqs-arr-green)" className="interactive-diagram-flowing-path" />
              
              {/* Delete Ack Return Path */}
              <path d="M 575 120 C 530 160, 430 160, 390 160" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#sqs-arr-green)" />
              <text x="480" y="178" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="600">DeleteMessage(ReceiptHandle) at t=12s</text>
            </svg>
          ) : (
            <svg viewBox="0 0 760 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="sqs-arr-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f87171" /></marker>
                <marker id="sqs-arr-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f59e0b" /></marker>
              </defs>

              {/* SQS Queue */}
              <g transform="translate(180, 50)">
                <rect width="250" height="120" rx="8" fill="rgba(248, 113, 113, 0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="125" y="26" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="800">SQS Queue (Timeout Fired!)</text>
                
                <rect x="25" y="42" width="200" height="55" rx="6" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" strokeWidth="1.5" />
                <text x="125" y="62" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Msg #101 Reappears!</text>
                <text x="125" y="78" textAnchor="middle" fill="#fca5a5" fontSize="9">30s Elapsed ➔ Made Visible Again</text>
              </g>

              {/* Consumer 1 (Slow / Stalled) */}
              <g transform="translate(540, 30)">
                <rect width="180" height="60" rx="8" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="90" y="24" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Consumer 1 (Stalled)</text>
                <text x="90" y="40" textAnchor="middle" fill="#fca5a5" fontSize="9">Still executing at t=35s...</text>
                <text x="90" y="52" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="600">Failed to call ChangeMessageVisibility</text>
              </g>

              {/* Consumer 2 (Picks Up Duplicate) */}
              <g transform="translate(540, 130)">
                <rect width="180" height="60" rx="8" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="90" y="24" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">Consumer 2 (Duplicate)</text>
                <text x="90" y="40" textAnchor="middle" fill="#fcd34d" fontSize="9">Polls &amp; Receives Same Msg #101</text>
                <text x="90" y="52" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="700">DUPLICATE EXECUTION HAZARD!</text>
              </g>

              {/* Arrows */}
              <path d="M 430 70 L 535 55" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#sqs-arr-red)" />
              <path d="M 430 130 L 535 155" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#sqs-arr-amber)" className="interactive-diagram-flowing-path" />
            </svg>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <strong style={{ color: '#34d399', fontSize: '11px' }}>Standard Ack Lifecycle:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              When a consumer receives a message, SQS keeps it in the queue but hides it from other consumers for 30s. The consumer deletes the message upon successful execution via its unique <code>receiptHandle</code>.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <strong style={{ color: '#f59e0b', fontSize: '11px' }}>Lease Extension Prevention:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              If batch processing takes longer than the visibility timeout, call <code>ChangeMessageVisibility</code> every 10–15s to extend the lease, preventing duplicate worker execution and split-brain writes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
