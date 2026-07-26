import React, { useState } from 'react';

interface SagaStep {
  id: number;
  cmd: string;
  target: string;
  status: string;
  color: string;
  compensatingCmd: string;
}

const SAGA_STEPS: SagaStep[] = [
  { id: 1, cmd: 'PlaceOrderCommand', target: 'Order Service', status: 'OrderPlacedEvent', color: '#38bdf8', compensatingCmd: 'CancelOrderCommand' },
  { id: 2, cmd: 'ProcessPaymentCommand', target: 'Payment Service', status: 'PaymentProcessedEvent', color: '#34d399', compensatingCmd: 'RefundPaymentCommand' },
  { id: 3, cmd: 'ReserveStockCommand', target: 'Inventory Service', status: 'StockReservedEvent', color: '#fbbf24', compensatingCmd: 'ReleaseStockCommand' },
  { id: 4, cmd: 'ConfirmOrderCommand', target: 'Order Service', status: 'OrderConfirmedEvent', color: '#a78bfa', compensatingCmd: 'N/A (Final Success)' },
];

export default function CqrsSagaProcessManagerDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [mode, setMode] = useState<'happy' | 'compensate'>('happy');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Sagas &amp; Process Managers Sequence Simulator</span>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => { setMode('happy'); setActiveStep(1); }}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: mode === 'happy' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'happy' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'happy' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ✅ Happy Path Execution
        </button>
        <button
          onClick={() => { setMode('compensate'); setActiveStep(3); }}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: 700,
            background: mode === 'compensate' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            color: mode === 'compensate' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: mode === 'compensate' ? '0 0 0 1.5px #f87171' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}
        >
          ⚠️ Failure &amp; Compensating Transactions
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SAGA_STEPS.map(s => {
            const isSelected = activeStep === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: isSelected ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? s.color : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: s.color, minWidth: '20px' }}>#{s.id}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                    {mode === 'happy' ? s.cmd : `Compensate: ${s.compensatingCmd}`}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: s.color, fontFamily: 'monospace' }}>→ {s.target} ({s.status})</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        {mode === 'happy' ? (
          <span><strong>Saga Orchestration:</strong> The OrderSaga Process Manager coordinates local transactions sequentially across microservices via commands and domain events.</span>
        ) : (
          <span><strong>Compensating Transactions:</strong> If step 3 (ReserveStock) fails, the Saga emits <code>RefundPaymentCommand</code> and <code>CancelOrderCommand</code> to roll back previous state changes.</span>
        )}
      </div>
    </div>
  );
}
