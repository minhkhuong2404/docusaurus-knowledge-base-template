import React, { useState } from 'react';

interface Span {
  id: string;
  service: string;
  operation: string;
  spanId: string;
  parentSpanId: string | null;
  durationMs: number;
  offsetPct: number;
  widthPct: number;
  color: string;
}

const SAMPLE_SPANS: Span[] = [
  { id: '1', service: 'API Gateway', operation: 'POST /orders/checkout', spanId: 'span-001', parentSpanId: null, durationMs: 145, offsetPct: 0, widthPct: 100, color: '#38bdf8' },
  { id: '2', service: 'Order Service', operation: 'OrderAggregate.create()', spanId: 'span-002', parentSpanId: 'span-001', durationMs: 110, offsetPct: 15, widthPct: 75, color: '#34d399' },
  { id: '3', service: 'Payment Service', operation: 'POST /charge', spanId: 'span-003', parentSpanId: 'span-002', durationMs: 50, offsetPct: 25, widthPct: 35, color: '#fbbf24' },
  { id: '4', service: 'Inventory Service', operation: 'reserveItems()', spanId: 'span-004', parentSpanId: 'span-002', durationMs: 35, offsetPct: 65, widthPct: 25, color: '#a78bfa' },
  { id: '5', service: 'PostgreSQL DB', operation: 'UPDATE inventory SET qty', spanId: 'span-005', parentSpanId: 'span-004', durationMs: 12, offsetPct: 75, widthPct: 12, color: '#f87171' },
];

export default function DistributedTracingDiagram() {
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(SAMPLE_SPANS[0]);

  const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Distributed Tracing Span Explorer (W3C TraceContext)</span>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11.5px', fontFamily: 'monospace' }}>
          <span style={{ color: 'var(--ifm-color-content-secondary)' }}>traceId: </span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{traceId}</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
          Total Duration: <strong style={{ color: '#34d399' }}>145ms</strong>
        </div>
      </div>

      {/* Flame graph timeline */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px' }}>
          Distributed Request Timeline (Span Waterfall)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SAMPLE_SPANS.map(span => {
            const isSelected = selectedSpan?.id === span.id;
            return (
              <div
                key={span.id}
                onClick={() => setSelectedSpan(span)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '12px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: span.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {span.service}
                </div>
                <div style={{ position: 'relative', height: '26px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${span.offsetPct}%`,
                      width: `${span.widthPct}%`,
                      height: '100%',
                      background: isSelected ? span.color : `${span.color}90`,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '8px',
                      boxShadow: isSelected ? `0 0 10px ${span.color}80` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap' }}>
                      {span.operation} ({span.durationMs}ms)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Span Details */}
      {selectedSpan && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: `1px solid ${selectedSpan.color}50` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: selectedSpan.color }}>{selectedSpan.service} :: {selectedSpan.operation}</span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>spanId: {selectedSpan.spanId}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
            <div>parentSpanId: {selectedSpan.parentSpanId || 'null (Root)'}</div>
            <div>duration: {selectedSpan.durationMs}ms</div>
            <div>traceparent header propagation: active</div>
          </div>
        </div>
      )}
    </div>
  );
}
