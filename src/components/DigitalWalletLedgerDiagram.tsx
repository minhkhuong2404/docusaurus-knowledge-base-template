import React, { useState } from 'react';

type WalletTab = 'ledger' | 'transactions' | 'eventsourcing';

export default function DigitalWalletLedgerDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<WalletTab>('ledger');
  const [transferAmount, setTransferAmount] = useState<number>(50);
  const [accountABalance, setAccountABalance] = useState<number>(500);
  const [accountBBalance, setAccountBBalance] = useState<number>(200);
  const [tccPhase, setTccPhase] = useState<'idle' | 'try' | 'confirm' | 'cancel'>('idle');

  const executeTransfer = () => {
    if (accountABalance >= transferAmount) {
      setAccountABalance(prev => prev - transferAmount);
      setAccountBBalance(prev => prev + transferAmount);
    }
  };

  const resetBalances = () => {
    setAccountABalance(500);
    setAccountBBalance(200);
    setTccPhase('idle');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(152, 162, 179, 0.25)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <circle cx="16" cy="15" r="2" />
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Digital Wallet Engine: Double-Entry Ledger, TC/C Distributed Transactions &amp; Event Sourcing
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('ledger')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'ledger' ? '1px solid #10b981' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'ledger' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'ledger' ? '#15803d' : 'var(--ifm-color-content)'
            }}
          >
            Double-Entry Ledger
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'transactions' ? '1px solid #0ea5e9' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'transactions' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
              color: activeTab === 'transactions' ? '#0284c7' : 'var(--ifm-color-content)'
            }}
          >
            TC/C vs 2PC vs Saga
          </button>
          <button
            onClick={() => setActiveTab('eventsourcing')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'eventsourcing' ? '1px solid #8b5cf6' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'eventsourcing' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === 'eventsourcing' ? '#6b21a8' : 'var(--ifm-color-content)'
            }}
          >
            1M TPS Event Sourcing
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: DOUBLE-ENTRY LEDGER */}
        {activeTab === 'ledger' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                  Interactive Ledger Transfer Simulator
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={executeTransfer}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none'
                    }}
                  >
                    Transfer ${transferAmount} (A -&gt; B)
                  </button>
                  <button
                    onClick={resetBalances}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(152, 162, 179, 0.4)',
                      color: 'var(--ifm-color-content)'
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Accounts Visualizer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ifm-background-color, #ffffff)', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>Wallet Account A</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>User ID: 101</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#b91c1c', marginTop: '6px' }}>
                    ${accountABalance}.00
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    Asset Debit Leg: Outgoing transfer recorded as Debit
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ifm-background-color, #ffffff)', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>Wallet Account B</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>User ID: 202</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '6px' }}>
                    ${accountBBalance}.00
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    Liability Credit Leg: Incoming transfer recorded as Credit
                  </div>
                </div>
              </div>

              {/* Double Entry Rules Table */}
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                <strong style={{ color: '#15803d' }}>The Invariant of Double-Entry Bookkeeping:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  A financial transaction must consist of at least two posting legs. The sum of all debits must strictly equal the sum of all credits (Total Debits = Total Credits). An account balance is never updated via an in-place SQL <code>UPDATE balance = balance - 100</code>; it is computed as the sum of all historical immutable ledger entries!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TC/C VS 2PC VS SAGA */}
        {activeTab === 'transactions' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Simulate TC/C Protocol:</span>
              <button
                onClick={() => setTccPhase('try')}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #0ea5e9', backgroundColor: tccPhase === 'try' ? 'rgba(14, 165, 233, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                1. Try Phase (Reserve Funds)
              </button>
              <button
                onClick={() => setTccPhase('confirm')}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #10b981', backgroundColor: tccPhase === 'confirm' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                2a. Confirm (Success)
              </button>
              <button
                onClick={() => setTccPhase('cancel')}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #ef4444', backgroundColor: tccPhase === 'cancel' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                2b. Cancel (Compensate)
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
                TC/C Current State: {tccPhase.toUpperCase()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#b91c1c' }}>Two-Phase Commit (2PC)</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Heavyweight database-level locks held across network round trips. Single point of failure at coordinator. Unusable at &gt;1,000 TPS.
                  </p>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#0284c7' }}>Try-Confirm/Cancel (TC/C)</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Two independent local transactions. Deducts funds in Try phase; credits receiver in Confirm phase. Supports parallel execution and low latency.
                  </p>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#15803d' }}>Saga (Orchestration)</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Linear execution of steps across microservices with compensating rollbacks. Ideal for cross-system workflows with higher latency tolerance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 1M TPS EVENT SOURCING */}
        {activeTab === 'eventsourcing' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#8b5cf6', marginBottom: '8px' }}>
                High-Performance Event Sourcing Pipeline (1,000,000 TPS)
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                To achieve 1,000,000 transactions per second without database bottlenecks, the wallet service adopts an <strong>in-memory event sourcing architecture</strong>:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '11px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>1. Local Log (mmap)</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Commands are appended to local disk via memory-mapped files (<code>mmap</code>), bypassing external network hops.
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: '#15803d' }}>2. Deterministic FSM</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Single-threaded in-memory state machine executes state changes with zero locks and zero lock contention.
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: '#d97706' }}>3. Raft Replication</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Event streams replicate to follower nodes via Raft consensus for high availability and zero data loss.
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: '#6b21a8' }}>4. CQRS Read Views</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Read-only replicas consume events asynchronously to serve balance queries and statements.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
