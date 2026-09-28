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

export default function DistributedTracingDiagram({ initialTab }: { initialTab?: 'pipeline' | 'waterfall' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'waterfall'>(initialTab || 'pipeline');
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(SAMPLE_SPANS[0]);

  const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Distributed Tracing Architecture & Span Waterfall
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'pipeline', label: '📡 OTel Collector Pipeline', color: '#38bdf8' },
            { id: 'waterfall', label: '📊 Span Waterfall Waterfall', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {activeTab === 'pipeline' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="pipe-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="pipe-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="pipe-arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fbbf24" />
                  </marker>
                </defs>

                {/* Node 1: Spring Boot */}
                <g transform="translate(20, 50)">
                  <rect x="0" y="0" width="180" height="110" rx="8" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="15" y="26" fill="#38bdf8" fontSize="12" fontWeight="700">Spring Boot Services</text>
                  <text x="15" y="46" fill="#cbd5e1" fontSize="9.5">Micrometer Tracing</text>
                  <rect x="12" y="56" width="156" height="42" rx="4" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(56, 189, 248, 0.2)" />
                  <text x="18" y="72" fill="#94a3b8" fontSize="8.5">W3C Context Injection</text>
                  <text x="18" y="88" fill="#38bdf8" fontSize="8">traceparent: 00-4bf92f...-01</text>
                </g>

                {/* Arrow 1 -> 2 */}
                <path d="M 205 105 L 305 105" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#pipe-arrow-blue)" className="interactive-diagram-flowing-path" />
                <text x="212" y="95" fill="#38bdf8" fontSize="9" fontWeight="700">OTLP / gRPC (Port 4317)</text>

                {/* Node 2: OTel Collector */}
                <g transform="translate(315, 30)">
                  <rect x="0" y="0" width="220" height="150" rx="8" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" strokeWidth="2" />
                  <text x="15" y="26" fill="#34d399" fontSize="13" fontWeight="800">OpenTelemetry Collector</text>
                  <text x="15" y="44" fill="#cbd5e1" fontSize="9.5">Decoupling &amp; Sampling Layer</text>

                  <rect x="12" y="54" width="196" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(52, 211, 153, 0.3)" />
                  <text x="18" y="71" fill="#86efac" fontSize="9">📥 Receivers: OTLP / Zipkin</text>

                  <rect x="12" y="85" width="196" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(52, 211, 153, 0.3)" />
                  <text x="18" y="102" fill="#86efac" fontSize="9">⚙️ Processors: Batch • Redact PII</text>

                  <rect x="12" y="116" width="196" height="26" rx="4" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(52, 211, 153, 0.3)" />
                  <text x="18" y="133" fill="#86efac" fontSize="9">📤 Exporters: Fanout to Backends</text>
                </g>

                {/* Arrow 2 -> 3A (Jaeger) */}
                <path d="M 540 85 L 615 65" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#pipe-arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="548" y="68" fill="#34d399" fontSize="8.5" fontWeight="700">OTLP</text>

                {/* Node 3A: Jaeger / Tempo */}
                <g transform="translate(625, 35)">
                  <rect x="0" y="0" width="150" height="60" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" />
                  <text x="12" y="24" fill="#34d399" fontSize="11" fontWeight="700">Jaeger / Grafana Tempo</text>
                  <text x="12" y="42" fill="#94a3b8" fontSize="8.5">Trace Storage &amp; Search</text>
                </g>

                {/* Arrow 2 -> 3B (Metrics Connector) */}
                <path d="M 540 125 L 615 145" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#pipe-arrow-amber)" className="interactive-diagram-flowing-path" />
                <text x="548" y="148" fill="#fbbf24" fontSize="8.5" fontWeight="700">Metrics</text>

                {/* Node 3B: Prometheus / RED Metrics */}
                <g transform="translate(625, 115)">
                  <rect x="0" y="0" width="150" height="60" rx="6" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" />
                  <text x="12" y="24" fill="#fbbf24" fontSize="11" fontWeight="700">Prometheus (RED)</text>
                  <text x="12" y="42" fill="#94a3b8" fontSize="8.5">Derived Span Metrics</text>
                </g>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.06)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '11px' }}>Zero Coupling:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Application pods send OTLP to a local DaemonSet collector. If Jaeger goes down, application traffic is never impacted.
                </p>
              </div>

              <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.06)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <strong style={{ color: '#34d399', fontSize: '11px' }}>Centralized PII Redaction:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  The collector scrubs credit cards, tokens, and social security numbers from span tags before persisting to disk.
                </p>
              </div>

              <div style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.06)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <strong style={{ color: '#fbbf24', fontSize: '11px' }}>Tail Sampling:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Collector keeps 100% of error spans and slow outlier requests, while sampling out 99% of normal 200 OK calls.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'waterfall' && (
          <div>
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
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? `1.5px solid ${span.color}` : '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: span.color, fontWeight: 700 }}>{span.service}</span>
                        <span style={{ color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>{span.durationMs}ms</span>
                      </div>

                      <div style={{ width: '100%', height: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: `${span.offsetPct}%`,
                            width: `${span.widthPct}%`,
                            height: '100%',
                            background: span.color,
                            borderRadius: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '6px',
                          }}
                        >
                          <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap' }}>
                            {span.operation}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedSpan && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: `1px solid ${selectedSpan.color}50` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: selectedSpan.color }}>{selectedSpan.service} :: {selectedSpan.operation}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>spanId: {selectedSpan.spanId}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
                  <div>parentSpanId: {selectedSpan.parentSpanId || 'null (Root)'}</div>
                  <div>duration: {selectedSpan.durationMs}ms</div>
                  <div>traceparent header: propagated</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
