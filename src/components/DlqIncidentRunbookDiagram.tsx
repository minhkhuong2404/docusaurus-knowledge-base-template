import React, { useState } from 'react';

interface RunbookStep {
  id: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  actions: string[];
  cliCommand?: string;
  color: string;
}

const STEPS: RunbookStep[] = [
  {
    id: 'TRIAGE',
    name: '1. Incident Triage',
    shortDesc: 'Assess the scale and scope of the DLQ spike.',
    longDesc: 'Triage failed message counts to classify the pattern: single message (data error), batch (deploy bug), or continuous stream (downstream service down).',
    actions: [
      'Query the DLQ size: is it growing or static?',
      'Inspect the first 5 message headers for "dlq-exception-class" and "dlq-failed-at".',
      'Identify the affected consumer group and topic partitions.',
    ],
    cliCommand: 'aws sqs get-queue-attributes --queue-url <dlq-url> --attribute-names ApproximateNumberOfMessages',
    color: '#fbbf24',
  },
  {
    id: 'CONTAIN',
    name: '2. Containment',
    shortDesc: 'Stop the bleeding to avoid server starvation.',
    longDesc: 'Prevent the error loop from consuming all connection pools or hitting downstream limits.',
    actions: [
      'If consumer is crash-looping: pause the container cluster or suspend message consumption.',
      'If downstream database is locked: open circuit breakers to drop traffic with fast backpressure.',
      'If schema mismatch: immediately rollback the producer or consumer deploy.',
    ],
    cliCommand: 'kubectl scale deployment order-consumer-service --replicas=0',
    color: '#ef4444',
  },
  {
    id: 'FIX',
    name: '3. Root Cause Correction',
    shortDesc: 'Deploy code updates or database patches.',
    longDesc: 'Correct the source of unprocessability so that when messages are re-sent, they succeed.',
    actions: [
      'Write-up a bug fix for logic errors (NPEs, invalid bounds) and deploy to staging/prod.',
      'If database is offline: complete restoration/failover processes.',
      'If schema changes are needed: update schema registry definitions and roll forward code.',
    ],
    color: '#a78bfa',
  },
  {
    id: 'REDRIVE',
    name: '4. Throttled Redrive',
    shortDesc: 'Replay messages back to main queue safely.',
    longDesc: 'Reprocess DLQ messages. Never dump 100k messages instantly; run at a controlled rate to watch for regression.',
    actions: [
      'Start SQS redrive or execute custom replay script.',
      'Set message speed limit (e.g. max 10 messages/second) to protect dependencies.',
      'Monitor error metrics: if main queue error rate stays at zero, scale up transfer speed.',
    ],
    cliCommand: 'aws sqs start-message-move-task --source-arn <dlq-arn> --destination-arn <source-arn> --max-number-of-messages-per-second 10',
    color: '#34d399',
  },
  {
    id: 'POST_MORTEM',
    name: '5. Post-Mortem Documentation',
    shortDesc: 'Prevent recurrence and update playbooks.',
    longDesc: 'Analyze systemic gaps that let this poison pill pass validation.',
    actions: [
      'Document why compatibility checks failed (e.g. missing pre-commit tests).',
      'Optimize consumer retry backoffs if visibility timeout saturation occurred.',
      'Add end-to-end integration tests covering this specific message payload structure.',
    ],
    color: '#38bdf8',
  },
];

export default function DlqIncidentRunbookDiagram(): React.JSX.Element {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState<string>('TRIAGE');

  const toggleStep = (id: string) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  const current = STEPS.find(s => s.id === activeStep) || STEPS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span style={{ color: '#34d399' }}>Production DLQ Incident Response Runbook</span>
      </div>

      {/* Progress tracker */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 'bold' }}>
          <span style={{ color: '#cbd5e1' }}>Incident Resolution Progress</span>
          <span style={{ color: progressPercent === 100 ? '#34d399' : '#38bdf8' }}>{progressPercent}% Complete</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent === 100 ? '#34d399' : '#38bdf8', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <style>{`
        .runbook-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .runbook-grid {
            grid-template-columns: 1fr;
          }
        }
        .runbook-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .runbook-item:hover {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.12);
        }
        .runbook-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
      `}</style>

      <div className="runbook-grid">
        
        {/* Steps checklists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map(step => {
            const isCompleted = !!completed[step.id];
            const isActive = activeStep === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className="runbook-item"
                style={{
                  borderLeft: `3px solid ${isActive ? step.color : 'transparent'}`,
                  background: isActive ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.6)',
                  borderColor: isActive ? step.color : 'rgba(255,255,255,0.06)',
                }}
              >
                <div
                  onClick={(e) => { e.stopPropagation(); toggleStep(step.id); }}
                  className="runbook-checkbox"
                  style={{
                    backgroundColor: isCompleted ? step.color : 'transparent',
                    borderColor: isCompleted ? step.color : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {isCompleted && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: isCompleted ? '#64748b' : '#cbd5e1', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                    {step.name}
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>
                    {step.shortDesc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info detail block */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.name} Details</h3>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.longDesc}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8.5px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Action Check Items
            </span>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px' }}>
              {current.actions.map((action, idx) => (
                <li key={idx} style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '3.5px', lineHeight: 1.4 }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {current.cliCommand && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8.5px', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Incident Command Tooling
              </span>
              <code style={{ fontSize: '9.5px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: '4px', display: 'block', overflowX: 'auto', whiteSpace: 'pre', color: '#cbd5e1' }}>
                {current.cliCommand}
              </code>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
