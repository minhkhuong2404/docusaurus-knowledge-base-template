import React, { useState } from 'react';

type ExchangeTab = 'orderbook' | 'disruptor' | 'multicast';

interface Order {
  id: string;
  price: number;
  qty: number;
  time: string;
}

export default function StockExchangeMatchingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ExchangeTab>('orderbook');
  const [bids, setBids] = useState<Order[]>([
    { id: 'B1', price: 150.25, qty: 100, time: '09:30:00.100' },
    { id: 'B2', price: 150.25, qty: 300, time: '09:30:00.102' },
    { id: 'B3', price: 150.20, qty: 500, time: '09:30:00.098' },
  ]);
  const [asks, setAsks] = useState<Order[]>([
    { id: 'A1', price: 150.30, qty: 200, time: '09:30:00.101' },
    { id: 'A2', price: 150.35, qty: 400, time: '09:30:00.105' },
    { id: 'A3', price: 150.40, qty: 1000, time: '09:30:00.095' },
  ]);
  const [matchedTrade, setMatchedTrade] = useState<string | null>(null);

  const simulateMarketBuy = () => {
    if (asks.length > 0) {
      const bestAsk = asks[0];
      setMatchedTrade(`Matched 100 shares @ $${bestAsk.price.toFixed(2)} with Ask #${bestAsk.id}`);
      if (bestAsk.qty > 100) {
        setAsks(prev => [{ ...prev[0], qty: prev[0].qty - 100 }, ...prev.slice(1)]);
      } else {
        setAsks(prev => prev.slice(1));
      }
    }
  };

  const resetBook = () => {
    setBids([
      { id: 'B1', price: 150.25, qty: 100, time: '09:30:00.100' },
      { id: 'B2', price: 150.25, qty: 300, time: '09:30:00.102' },
      { id: 'B3', price: 150.20, qty: 500, time: '09:30:00.098' },
    ]);
    setAsks([
      { id: 'A1', price: 150.30, qty: 200, time: '09:30:00.101' },
      { id: 'A2', price: 150.35, qty: 400, time: '09:30:00.105' },
      { id: 'A3', price: 150.40, qty: 1000, time: '09:30:00.095' },
    ]);
    setMatchedTrade(null);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(152, 162, 179, 0.25)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Stock Exchange Engine: Price-Time LOB, LMAX Disruptor &amp; Deterministic Sequencer
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('orderbook')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'orderbook' ? '1px solid #f59e0b' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'orderbook' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'orderbook' ? '#d97706' : 'var(--ifm-color-content)'
            }}
          >
            Order Book (LOB)
          </button>
          <button
            onClick={() => setActiveTab('disruptor')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'disruptor' ? '1px solid #0ea5e9' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'disruptor' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
              color: activeTab === 'disruptor' ? '#0284c7' : 'var(--ifm-color-content)'
            }}
          >
            LMAX Disruptor Ring Buffer
          </button>
          <button
            onClick={() => setActiveTab('multicast')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'multicast' ? '1px solid #10b981' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'multicast' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'multicast' ? '#15803d' : 'var(--ifm-color-content)'
            }}
          >
            Deterministic Multicast (ITCH)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: ORDER BOOK (LOB) */}
        {activeTab === 'orderbook' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>
                  Live Limit Order Book (FIFO Price-Time Priority)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={simulateMarketBuy}
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
                    Execute Market Buy (100 shares)
                  </button>
                  <button
                    onClick={resetBook}
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
                    Reset Book
                  </button>
                </div>
              </div>

              {matchedTrade && (
                <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', fontSize: '11px', fontWeight: 700, color: '#15803d', marginBottom: '10px' }}>
                  Match Event: {matchedTrade}
                </div>
              )}

              {/* LOB Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Bids Column */}
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', marginBottom: '6px' }}>BIDS (Buy Orders - Descending Price)</div>
                  {bids.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '11px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span><strong>${b.price.toFixed(2)}</strong></span>
                      <span>{b.qty} shs</span>
                      <span style={{ color: '#64748b', fontSize: '10px' }}>{b.time}</span>
                    </div>
                  ))}
                </div>

                {/* Asks Column */}
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '6px' }}>ASKS (Sell Orders - Ascending Price)</div>
                  {asks.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', fontSize: '11px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span><strong>${a.price.toFixed(2)}</strong></span>
                      <span>{a.qty} shs</span>
                      <span style={{ color: '#64748b', fontSize: '10px' }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Structure Explanations */}
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                <strong>Physical Data Structure: B-Tree / Skip List + Doubly Linked List</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  The Limit Order Book organizes price levels in a self-balancing tree (e.g. Red-Black or B-Tree), providing $O(\log M)$ price lookup and immediate $O(1)$ access to best Bid and best Ask. At each price level, orders are linked in a <strong>Doubly Linked List</strong> for $O(1)$ append (new order) and $O(1)$ deletion (order cancellation / fill).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LMAX DISRUPTOR RING BUFFER */}
        {activeTab === 'disruptor' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginBottom: '8px' }}>
                LMAX Disruptor: Lock-Free High-Performance Ring Buffer
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                To achieve sub-microsecond matching (&lt; 100μs p99), the exchange rejects standard Java <code>BlockingQueue</code> (which relies on OS mutex locks and condition signals). Instead, it uses the <strong>LMAX Disruptor</strong>:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#0284c7' }}>1. Pre-Allocated Circular Buffer</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    All event objects in the ring buffer are allocated at startup. Slots are overwritten in-place. Zero runtime allocation means <strong>Zero Garbage Collection (GC) pauses</strong>!
                  </p>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#15803d' }}>2. Cache Line Padding (False Sharing)</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Sequence numbers are padded with 7 unused <code>long</code> variables (56 bytes) to fill an entire 64-byte L1/L2 CPU cache line. This prevents CPU core cache invalidation (False Sharing).
                  </p>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #ffffff)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#b45309' }}>3. Single-Threaded Core Pinning</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    The matching engine runs as a single thread pinned to a dedicated CPU core via <code>isolcpus</code> and <code>taskset</code>. Zero locks, zero thread context-switches, operating at memory bus speed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DETERMINISTIC MULTICAST */}
        {activeTab === 'multicast' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginBottom: '8px' }}>
                Deterministic Sequencer &amp; Reliable UDP Multicast (Aeron / PGM)
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                In a regulated financial exchange (SEC Reg NMS), fair distribution of market data is legally mandated. If one trading firm receives price updates microseconds before others, it enables front-running:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>Monotonic Sequencer &amp; 100% Replay</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px', lineHeight: 1.4 }}>
                    Before entering the matching engine, every order receives a monotonically increasing sequence ID ($1, 2, 3\dots$). Because the engine is completely deterministic, replaying the sequence log from offset 0 reconstructs the identical exchange state after crash recovery.
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>Reliable Multicast (ITCH / Aeron)</div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px', lineHeight: 1.4 }}>
                    Instead of sending unicast TCP packets to thousands of brokers sequentially (where broker #1 gets data before broker #500), the exchange broadcasts market data via <strong>Reliable UDP Multicast</strong> over equal-length fiber optic cables, ensuring simultaneous arrival.
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
