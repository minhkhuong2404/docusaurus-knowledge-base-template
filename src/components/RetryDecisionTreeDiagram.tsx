import React, { useState } from 'react';

export default function RetryDecisionTreeDiagram() {
  const [step, setStep] = useState<number>(1);
  const [ansIdempotent, setAnsIdempotent] = useState<boolean | null>(null);
  const [ansTransient, setAnsTransient] = useState<boolean | null>(null);
  const [ansDepth, setAnsDepth] = useState<'outer' | 'inner' | null>(null);

  const resetWizard = () => {
    setStep(1);
    setAnsIdempotent(null);
    setAnsTransient(null);
    setAnsDepth(null);
  };

  const handleIdempotent = (isYes: boolean) => {
    setAnsIdempotent(isYes);
    if (isYes) {
      setStep(2);
    } else {
      setStep(4); // Verdict: No retry
    }
  };

  const handleTransient = (isYes: boolean) => {
    setAnsTransient(isYes);
    if (isYes) {
      setStep(3);
    } else {
      setStep(4); // Verdict: Fail fast
    }
  };

  const handleDepth = (depth: 'outer' | 'inner') => {
    setAnsDepth(depth);
    setStep(4); // Final Verdict
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Retry Decision Guide — Interactive Wizard</span>

        <button onClick={resetWizard} style={{
          marginLeft: 'auto', padding: '5px 12px', borderRadius: '6px', border: 'none',
          background: 'rgba(255,255,255,0.06)', color: 'var(--ifm-color-content-secondary)',
          fontSize: '11.5px', cursor: 'pointer', fontWeight: 600
        }}>
          🔄 Reset Wizard
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="wizard-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .wizard-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Wizard Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Step 1 */}
          <div style={{
            padding: '12px', borderRadius: '8px',
            background: step === 1 ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${step === 1 ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`,
            opacity: step < 1 ? 0.4 : 1
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '4px' }}>QUESTION 1:</div>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#e2e8f0' }}>Is the operation idempotent?</div>
            <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 10px 0' }}>
              (GET, PUT, DELETE, or POST with Idempotency-Key header)
            </p>
            {step === 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleIdempotent(true)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#34d399',
                  color: '#090b14', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>YES ✅</button>
                <button onClick={() => handleIdempotent(false)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#f87171',
                  color: '#ffffff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>NO ❌</button>
              </div>
            )}
            {ansIdempotent !== null && (
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: ansIdempotent ? '#34d399' : '#f87171' }}>
                Answer: {ansIdempotent ? 'YES' : 'NO'}
              </span>
            )}
          </div>

          {/* Step 2 */}
          <div style={{
            padding: '12px', borderRadius: '8px',
            background: step === 2 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${step === 2 ? '#fbbf24' : 'rgba(255,255,255,0.06)'}`,
            opacity: step < 2 ? 0.4 : 1
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>QUESTION 2:</div>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#e2e8f0' }}>Is the error transient?</div>
            <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 10px 0' }}>
              (5xx, Timeout, Connection Refused, 429 Rate Limit)
            </p>
            {step === 2 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleTransient(true)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#34d399',
                  color: '#090b14', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>YES ✅</button>
                <button onClick={() => handleTransient(false)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#f87171',
                  color: '#ffffff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>NO ❌</button>
              </div>
            )}
            {ansTransient !== null && (
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: ansTransient ? '#34d399' : '#f87171' }}>
                Answer: {ansTransient ? 'YES' : 'NO'}
              </span>
            )}
          </div>

          {/* Step 3 */}
          <div style={{
            padding: '12px', borderRadius: '8px',
            background: step === 3 ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${step === 3 ? '#a78bfa' : 'rgba(255,255,255,0.06)'}`,
            opacity: step < 3 ? 0.4 : 1
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '4px' }}>QUESTION 3:</div>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#e2e8f0' }}>Where is this call in the microservice chain?</div>
            {step === 3 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => handleDepth('outer')} style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#38bdf8',
                  color: '#090b14', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
                }}>Outer Edge (1st hop)</button>
                <button onClick={() => handleDepth('inner')} style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fbbf24',
                  color: '#090b14', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
                }}>Inner Hop (3+ deep)</button>
              </div>
            )}
            {ansDepth !== null && (
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa' }}>
                Answer: {ansDepth === 'outer' ? 'Outer Edge' : 'Inner Service Hop'}
              </span>
            )}
          </div>
        </div>

        {/* Verdict Details Panel */}
        <div className="interactive-diagram-details-card" style={{
          borderColor: step === 4 ? (ansDepth === 'outer' ? '#34d39950' : '#f8717150') : 'rgba(255,255,255,0.08)'
        }}>
          <div className="interactive-diagram-card-header">
            <h3>Decision Verdict</h3>
          </div>

          {step < 4 ? (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px', padding: '30px 0' }}>
              Answer the questions on the left to determine your retry strategy.
            </div>
          ) : (
            <div>
              {ansIdempotent === false && (
                <div>
                  <h4 style={{ color: '#f87171', margin: '0 0 8px 0' }}>❌ Verdict: Do NOT Retry (Fail Fast)</h4>
                  <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                    Retrying a non-idempotent operation risks double charges or duplicate database records.
                  </p>
                  <div style={{ fontSize: '11.5px', background: 'rgba(248,113,113,0.1)', padding: '8px 10px', borderRadius: '6px', color: '#f87171' }}>
                    <strong>Action:</strong> Fail fast and return error to caller. Add an <code>Idempotency-Key</code> header to enable future retries.
                  </div>
                </div>
              )}

              {ansIdempotent === true && ansTransient === false && (
                <div>
                  <h4 style={{ color: '#f87171', margin: '0 0 8px 0' }}>❌ Verdict: Fail Fast (No Retry)</h4>
                  <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                    Persistent errors (400 Bad Request, 401 Unauthorized, NPE) will never succeed on retry.
                  </p>
                  <div style={{ fontSize: '11.5px', background: 'rgba(248,113,113,0.1)', padding: '8px 10px', borderRadius: '6px', color: '#f87171' }}>
                    <strong>Action:</strong> Return error immediately. Fix client request payload or application code.
                  </div>
                </div>
              )}

              {ansIdempotent === true && ansTransient === true && ansDepth === 'outer' && (
                <div>
                  <h4 style={{ color: '#34d399', margin: '0 0 8px 0' }}>✅ Verdict: Retry with Exponential Backoff + Jitter</h4>
                  <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                    This operation is safe to retry and the error is transient at the outer edge of your system.
                  </p>
                  <div style={{ fontSize: '11.5px', background: 'rgba(52,211,153,0.1)', padding: '8px 10px', borderRadius: '6px', color: '#34d399' }}>
                    <strong>Config:</strong> <code>maxAttempts: 3</code>, <code>initialDelay: 100ms</code>, <code>fullJitter: true</code>, <code>maxDelay: 5000ms</code>.
                  </div>
                </div>
              )}

              {ansIdempotent === true && ansTransient === true && ansDepth === 'inner' && (
                <div>
                  <h4 style={{ color: '#fbbf24', margin: '0 0 8px 0' }}>⚠️ Verdict: Propagate Error or Use Retry Budget</h4>
                  <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
                    Retrying deep inside a 3+ hop call chain causes exponential retry amplification ($N^D$).
                  </p>
                  <div style={{ fontSize: '11.5px', background: 'rgba(251,191,36,0.1)', padding: '8px 10px', borderRadius: '6px', color: '#fbbf24' }}>
                    <strong>Action:</strong> Do not retry internally. Propagate error to outer gateway, or pass an <code>X-Retry-Budget</code> header.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
