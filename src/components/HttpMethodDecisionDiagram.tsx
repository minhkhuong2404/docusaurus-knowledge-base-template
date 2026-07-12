import React, { useState } from 'react';

type Step = 'start' | 'safe' | 'modify' | 'replacement' | 'delete';

export default function HttpMethodDecisionDiagram(): React.JSX.Element {
  const [step, setStep] = useState<Step>('start');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🧭 HTTP Method Selection Decision Framework
        </h3>
      </div>

      <div style={{ padding: '1.2rem', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="interactive-diagram-grid-bg">
        {/* Step states */}
        <div>
          {step === 'start' && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Question 1: Is this a read-only (safe) operation?</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Safe operations must not modify any server-side database state.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('safe')} style={{ padding: '6px 12px', background: 'rgba(74,222,128,0.12)', border: '1px solid #4ade80', borderRadius: 4, color: '#4ade80', fontSize: '0.74rem', cursor: 'pointer' }}>Yes (Read-Only)</button>
                <button onClick={() => setStep('modify')} style={{ padding: '6px 12px', background: 'rgba(251,146,60,0.12)', border: '1px solid #fb923c', borderRadius: 4, color: '#fb923c', fontSize: '0.74rem', cursor: 'pointer' }}>No (Modifies State)</button>
              </div>
            </div>
          )}

          {step === 'safe' && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>Recommended Method: GET / HEAD</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Use <strong>GET</strong> to retrieve representations of resources. Use <strong>HEAD</strong> if you only need the header metadata (e.g. Content-Length) without downloading the body payload.
              </p>
              <button onClick={() => setStep('start')} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#cbd5e1', fontSize: '0.7rem', cursor: 'pointer' }}>Restart Selector 🔄</button>
            </div>
          )}

          {step === 'modify' && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Question 2: Are you modifying an existing resource or creating a new one?</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Determines resource existence state context.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('replacement')} style={{ padding: '6px 12px', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8', borderRadius: 4, color: '#38bdf8', fontSize: '0.74rem', cursor: 'pointer' }}>Modifying Existing Resource</button>
                <button onClick={() => setStep('delete')} style={{ padding: '6px 12px', background: 'rgba(248,113,113,0.12)', border: '1px solid #f87171', borderRadius: 4, color: '#f87171', fontSize: '0.74rem', cursor: 'pointer' }}>Deleting Resource</button>
                <button onClick={() => {}} style={{ display: 'none' }}></button>
                <button onClick={() => setStep('safe')} style={{ display: 'none' }}></button>
                <button onClick={() => setStep('start')} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#cbd5e1', fontSize: '0.74rem', cursor: 'pointer' }}>Creating New Resource (POST)</button>
              </div>
            </div>
          )}

          {step === 'replacement' && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Question 3: Are you performing a complete replacement or partial edit?</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Determines PUT vs PATCH boundaries.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep('safe')} style={{ padding: '6px 12px', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8', borderRadius: 4, color: '#38bdf8', fontSize: '0.74rem', cursor: 'pointer' }}>Full Replacement (PUT)</button>
                <button onClick={() => setStep('start')} style={{ padding: '6px 12px', background: 'rgba(167,139,250,0.12)', border: '1px solid #a78bfa', borderRadius: 4, color: '#a78bfa', fontSize: '0.74rem', cursor: 'pointer' }}>Partial Update (PATCH)</button>
              </div>
            </div>
          )}

          {step === 'delete' && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f87171' }}>Recommended Method: DELETE</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Use <strong>DELETE</strong> to delete the resource identified by the URI. It is idempotent (multiple identical requests yield the same state outcomes).
              </p>
              <button onClick={() => setStep('start')} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#cbd5e1', fontSize: '0.7rem', cursor: 'pointer' }}>Restart Selector 🔄</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
