import React, { useState } from 'react';

interface ConceptDetail {
  id: string;
  tabLabel: string;
  title: string;
  description: string;
  steps: string[];
  warningNote: string;
  fixAction: string;
  color: string;
}

const CONCEPTS: Record<string, ConceptDetail> = {
  VISIBILITY: {
    id: 'VISIBILITY',
    tabLabel: '1. Visibility Timeout',
    title: 'Visibility Timeout (SQS) & Ack Timeout (RabbitMQ)',
    description: 'When a consumer retrieves a message, the broker keeps it in the queue but hides it from other consumers for a configured window to avoid duplicate execution.',
    steps: [
      'Consumer A dequeues Message 1. Visibility timer (e.g., 30s) starts.',
      'Message 1 enters "Invisible" state inside the queue.',
      'If Consumer A crashes or takes > 30s (GC pause, slow DB) to ACK...',
      'Visibility timer expires. Message 1 becomes visible again.',
      'Consumer B retrieves Message 1. BOTH consumers are now processing the same message (duplication trap!).',
    ],
    warningNote: 'Setting Visibility Timeout too close to average processing time leads to massive duplicate spikes under high load.',
    fixAction: 'Configure visibility timeout to at least 6× your average message processing duration.',
    color: '#fbbf24',
  },
  MAX_ATTEMPTS: {
    id: 'MAX_ATTEMPTS',
    tabLabel: '2. Max Receive Count',
    title: 'Max Receive Count / Max attempts',
    description: 'A numeric threshold representing how many times a broker is allowed to re-deliver a failed message before isolating it.',
    steps: [
      'Delivery 1 fails (NACK or Timeout) → receiveCount = 1.',
      'Backoff wait delay is applied.',
      'Delivery 2 fails (NACK or Timeout) → receiveCount = 2.',
      'Delivery 3 fails (NACK or Timeout) → receiveCount = 3.',
      'receiveCount (3) exceeds maxReceiveCount (3) → Message is automatically routed to DLQ.',
    ],
    warningNote: 'Setting max attempts too low (1-2) DLQs transient network blips prematurely. Setting it too high (10+) causes poison pills to block consumers for too long.',
    fixAction: 'Keep max attempts between 3 to 5 for production pipelines.',
    color: '#f472b6',
  },
};

export default function DlqTimeoutRetryDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('VISIBILITY');

  const current = CONCEPTS[activeTab];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ color: '#34d399' }}>Broker Timeouts &amp; Redelivery Explorer</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {Object.values(CONCEPTS).map(concept => (
          <button
            key={concept.id}
            onClick={() => setActiveTab(concept.id)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: activeTab === concept.id ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: activeTab === concept.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeTab === concept.id ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {concept.tabLabel}
          </button>
        ))}
      </div>

      <style>{`
        .concept-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .concept-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="concept-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="concept-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="concept-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {activeTab === 'VISIBILITY' ? (
              // Visibility Timeout layout
              <g>
                {/* SQS Queue box */}
                <rect x="20" y="40" width="120" height="120" rx="8" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="80" y="55" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800">SQS Queue</text>
                
                {/* Hidden Message 1 */}
                <rect x="35" y="80" width="90" height="30" rx="4" fill="rgba(15,23,42,0.8)" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3 3" />
                <text x="80" y="94" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">Message 1 (Invisible)</text>
                <text x="80" y="103" textAnchor="middle" fill="#94a3b8" fontSize="6">Timeout timer active ⏱️</text>

                {/* Consumer A box */}
                <rect x="210" y="25" width="110" height="50" rx="6" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="265" y="42" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="800">Consumer A</text>
                <text x="265" y="54" textAnchor="middle" fill="#94a3b8" fontSize="7">Processing (Slow GC)...</text>
                <text x="265" y="65" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="bold">T = 32s (Overrun!)</text>

                {/* Consumer B box */}
                <rect x="210" y="115" width="110" height="50" rx="6" fill="rgba(167,135,250,0.1)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="265" y="132" textAnchor="middle" fill="#a78bfa" fontSize="8.5" fontWeight="800">Consumer B</text>
                <text x="265" y="144" textAnchor="middle" fill="#94a3b8" fontSize="7">Dequeues Msg 1</text>
                <text x="265" y="155" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="bold">⚠️ DUPLICATE RUN</text>

                {/* Paths */}
                {/* Queue to Consumer A */}
                <path d="M 140 70 L 202 55" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#concept-arr)" />
                {/* Re-deliver to Consumer B */}
                <path d="M 140 110 L 202 135" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3"
                      className="interactive-diagram-flowing-path" markerEnd="url(#concept-arr-color)" />
              </g>
            ) : (
              // Max Attempts Layout
              <g>
                {/* Main Queue */}
                <rect x="20" y="40" width="120" height="50" rx="6" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="80" y="60" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800">Main Queue</text>
                <text x="80" y="73" textAnchor="middle" fill="#94a3b8" fontSize="7">receiveCount: 3 / max: 3</text>

                {/* Dead Letter Queue */}
                <rect x="20" y="125" width="120" height="50" rx="6" fill="rgba(244,114,182,0.1)" stroke="#f472b6" strokeWidth="1.5" />
                <text x="80" y="145" textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="800">DLQ (Dead Letter)</text>
                <text x="80" y="158" textAnchor="middle" fill="#94a3b8" fontSize="7">Isolates message 🔒</text>

                {/* Consumer */}
                <rect x="210" y="80" width="110" height="60" rx="6" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="265" y="100" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="800">Consumer</text>
                <text x="265" y="112" textAnchor="middle" fill="#ef4444" fontSize="7">Fails 3rd Attempt</text>
                <text x="265" y="125" textAnchor="middle" fill="#94a3b8" fontSize="6">NACK returned</text>

                {/* Flow lines */}
                {/* Main Queue -> Consumer */}
                <path d="M 140 65 L 202 95" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#concept-arr)" />
                {/* Consumer -> NACK */}
                <path d="M 210 120 L 148 135" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="3 3" markerEnd="url(#concept-arr)" />
                {/* Route to DLQ */}
                <path d="M 80 90 L 80 117" fill="none" stroke="#f472b6" strokeWidth="1.8"
                      className="interactive-diagram-flowing-path" markerEnd="url(#concept-arr-color)" />
              </g>
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.description}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Execution Lifecycle Stages
            </span>
            <ol style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px' }}>
              {current.steps.map((step, idx) => (
                <li key={idx} style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '3px', lineHeight: 1.4 }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div style={{
            background: 'rgba(239,68,68,0.04)',
            borderLeft: `3px solid #ef4444`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '10.5px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#ef4444', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              ⚠️ Design Danger
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {current.warningNote}
            </span>
          </div>

          <div style={{
            background: 'rgba(52,211,153,0.04)',
            borderLeft: `3px solid #34d399`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '10.5px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#34d399', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              🔧 Production Solution
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {current.fixAction}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
