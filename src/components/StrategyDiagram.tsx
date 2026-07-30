import React, { useState } from 'react';

interface StrategyOption {
  id: string;
  name: string;
  badge: string;
  color: string;
  algorithmClass: string;
  executionLogic: string;
  feeStructure: string;
}

const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    id: 'card',
    name: '1. Credit Card Payment Strategy',
    badge: 'CARD STRATEGY',
    color: '#38bdf8', // Sky Blue
    algorithmClass: 'CreditCardStrategy implements PaymentStrategy',
    executionLogic: 'Validates 16-digit PAN, CVV, and expiration date. Submits payload to Stripe API.',
    feeStructure: 'Processing Fee: 2.9% + $0.30 per transaction'
  },
  {
    id: 'paypal',
    name: '2. PayPal Express Strategy',
    badge: 'PAYPAL STRATEGY',
    color: '#a78bfa', // Purple
    algorithmClass: 'PayPalStrategy implements PaymentStrategy',
    executionLogic: 'Redirects user to PayPal OAuth portal for tokenized approval.',
    feeStructure: 'Processing Fee: 3.49% + $0.49 per transaction'
  },
  {
    id: 'crypto',
    name: '3. Crypto Web3 Strategy',
    badge: 'CRYPTO STRATEGY',
    color: '#34d399', // Emerald
    algorithmClass: 'CryptoStrategy implements PaymentStrategy',
    executionLogic: 'Prompts MetaMask web3 signature for USDC ERC-20 token transfer.',
    feeStructure: 'Processing Fee: Network Gas Fee (0.1%)'
  }
];

export default function StrategyDiagram() {
  const [activeId, setActiveId] = useState<string>('card');
  const current = STRATEGY_OPTIONS.find(s => s.id === activeId) || STRATEGY_OPTIONS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Strategy Design Pattern: Interchangeable Algorithm Execution</span>
      </div>

      {/* Strategy Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {STRATEGY_OPTIONS.map((s) => {
            const isActive = activeId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                style={{
                  background: isActive ? `${s.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? s.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: s.color, background: `${s.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {s.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {s.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Concrete Strategy Class
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.algorithmClass}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Cost / Fee Metric
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.feeStructure}
            </div>
          </div>
        </div>

        <div style={{ background: `${current.color}15`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${current.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: current.color }}>Algorithm Execution Details: </strong>
          {current.executionLogic}
        </div>
      </div>
    </div>
  );
}
