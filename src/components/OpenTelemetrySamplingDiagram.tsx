import React, { useState } from 'react';

export default function OpenTelemetrySamplingDiagram({ initialTab = 'tail_vs_head' }: { initialTab?: 'tail_vs_head' | 'multi_collector' | 'config_simulator' | 'cost_calculator' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'tail_vs_head' | 'multi_collector' | 'config_simulator' | 'cost_calculator'>(initialTab);
  const [selectedTraceType, setSelectedTraceType] = useState<'error' | 'slow' | 'normal'>('error');
  
  // Cost calculator state
  const [reqPerSec, setReqPerSec] = useState<number>(10000);
  const [errorRatePercent, setErrorRatePercent] = useState<number>(0.5);
  const [sampleRatePercent, setSampleRatePercent] = useState<number>(1.0);

  // Math: 1 request = 8 spans = 4KB uncompressed.
  // 10,000 req/s = 40 MB/s = 103 TB / month
  const monthlyVolumeTb = (reqPerSec * 4 * 3600 * 24 * 30) / (1024 * 1024 * 1024);
  // Full 100% cost at $0.15/GB
  const fullCostMonthly = Math.round(monthlyVolumeTb * 1024 * 0.15);
  // Head-based 1% cost
  const headCostMonthly = Math.round(fullCostMonthly * 0.01);
  // Tail-based cost: All errors + 1% of normal
  const tailTrafficRatio = (errorRatePercent / 100) + ((sampleRatePercent / 100) * (1 - errorRatePercent / 100));
  const tailCostMonthly = Math.round(fullCostMonthly * tailTrafficRatio);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .otel-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          OpenTelemetry Sampling Engine: Head-based vs Tail-based Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'tail_vs_head', label: '⚖️ 1. Head vs Tail Decision Flow', color: '#38bdf8' },
            { id: 'multi_collector', label: '🔀 2. Multi-Collector Trace Routing', color: '#34d399' },
            { id: 'config_simulator', label: '⚙️ 3. Policy Evaluator & YAML Spec', color: '#fbbf24' },
            { id: 'cost_calculator', label: '💰 4. Cloud Storage Cost ROI', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: HEAD VS TAIL DECISION FLOW */}
        {activeTab === 'tail_vs_head' && (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 280" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="otel-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="otel-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="otel-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Microservice Pods */}
                <rect x="20" y="30" width="160" height="220" rx="8" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="100" y="55" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Microservices Fleet</text>
                <text x="100" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Java Spring Boot Pods</text>

                {[
                  { y: 85, name: 'API Gateway' },
                  { y: 135, name: 'Order Service' },
                  { y: 185, name: 'Payment (HTTP 500)' }
                ].map((s, idx) => (
                  <g key={idx}>
                    <rect x="35" y={s.y} width="130" height="38" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1" />
                    <text x="100" y={s.y + 23} textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">{s.name}</text>
                  </g>
                ))}

                {/* Stream 100% Spans */}
                <path d="M 180 140 L 270 140" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#otel-arrow-blue)" />
                <text x="225" y="130" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="700">100% Spans</text>

                {/* OTel Collector Buffer */}
                <rect x="270" y="40" width="230" height="200" rx="8" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="385" y="65" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">OpenTelemetry Collector</text>
                <text x="385" y="82" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">RAM Buffer (decision_wait: 10s)</text>

                <rect x="290" y="95" width="190" height="40" rx="6" fill="rgba(251,191,36,0.2)" />
                <text x="385" y="118" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">Holds In-Flight Trace Trees</text>

                <rect x="290" y="145" width="190" height="80" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" />
                <text x="385" y="165" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10" fontWeight="700">Tail-Sampling Policy Engine</text>
                <text x="385" y="182" textAnchor="middle" fill="#f87171" fontSize="9">1. Error (5xx) ➔ 100% Kept</text>
                <text x="385" y="197" textAnchor="middle" fill="#fbbf24" fontSize="9">2. Latency &gt; 2s ➔ 100% Kept</text>
                <text x="385" y="212" textAnchor="middle" fill="#34d399" fontSize="9">3. Normal 200 ➔ 1% Sampled</text>

                {/* Decision Branch: Kept */}
                <path d="M 500 120 C 540 120, 550 80, 590 80" stroke="#f87171" strokeWidth="2" markerEnd="url(#otel-arrow-red)" />
                <rect x="590" y="55" width="190" height="55" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.2" />
                <text x="685" y="78" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">100% Errors & Outliers</text>
                <text x="685" y="96" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Saved to Grafana Tempo / Jaeger</text>

                {/* Decision Branch: Dropped */}
                <path d="M 500 170 C 540 170, 550 200, 590 200" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#otel-arrow-green)" />
                <rect x="590" y="170" width="190" height="55" rx="6" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.2" />
                <text x="685" y="193" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">99% Normal Traces Dropped</text>
                <text x="685" y="211" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Disposed in RAM (Zero disk cost)</text>
              </svg>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px', fontSize: '13px' }}>
                Head-based vs Tail-based Sampling: The Critical Difference
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Head-based Sampling:</strong> The decision is made at the very first hop (API Gateway / Ingress). Because the request has just started, the gateway cannot predict whether downstream microservices will encounter an unhandled exception or a database timeout. A naive 1% random sample almost certainly misses rare 0.1% production outages!
                <br />
                <strong>Tail-based Sampling:</strong> Services stream 100% of spans to the OTel Collector. The Collector buffers them in RAM for 10 seconds until the entire trace finishes. Only then does it evaluate the full trace: retaining 100% of errors and high-latency anomalies while dropping 99% of boring 200 OK traffic.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-COLLECTOR ROUTING */}
        {activeTab === 'multi_collector' && (
          <div>
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                ⚠️ The Multi-Collector Split-Trace Trap
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                When running multiple OTel Collector replicas behind a standard round-robin Kubernetes Service, Span 1 (Gateway) might go to Collector A, while Span 3 (Payment Error) goes to Collector B. Neither collector possesses the complete trace, causing tail-sampling policies to fail!
              </div>
            </div>

            {/* Solution Architecture */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>
                ✅ The 2-Tier Load-Balancing Exporter Solution
              </div>
              <svg viewBox="0 0 800 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <rect x="20" y="50" width="150" height="80" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="95" y="85" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">App Pods</text>
                <text x="95" y="105" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">OTLP gRPC Export</text>

                <path d="M 170 90 L 250 90" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#otel-arrow-blue)" />

                {/* Tier 1 Gateway */}
                <rect x="250" y="35" width="210" height="110" rx="8" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="355" y="65" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="700">Tier 1: OTel Gateway</text>
                <text x="355" y="85" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10">loadbalancingexporter</text>
                <text x="355" y="102" textAnchor="middle" fill="#34d399" fontSize="9">routing_key: trace_id</text>
                <text x="355" y="122" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">Consistent hash ring routing</text>

                <path d="M 460 70 L 550 50" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#otel-arrow-blue)" />
                <path d="M 460 110 L 550 130" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#otel-arrow-blue)" />

                {/* Tier 2 Collectors */}
                <rect x="550" y="25" width="220" height="55" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.2" />
                <text x="660" y="48" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Tail Collector Pod 1</text>
                <text x="660" y="65" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Receives ALL Spans for Hash(TraceID) % 2 == 0</text>

                <rect x="550" y="105" width="220" height="55" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.2" />
                <text x="660" y="128" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Tail Collector Pod 2</text>
                <text x="660" y="145" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Receives ALL Spans for Hash(TraceID) % 2 == 1</text>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIG SIMULATOR */}
        {activeTab === 'config_simulator' && (
          <div>
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              {[
                { id: 'error', label: '1. Trace with Exception / 500', color: '#f87171' },
                { id: 'slow', label: '2. Trace with Latency = 2,400ms', color: '#fbbf24' },
                { id: 'normal', label: '3. Normal Trace (200 OK, 65ms)', color: '#34d399' }
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedTraceType(b.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11px',
                    background: selectedTraceType === b.id ? `${b.color}25` : 'rgba(255,255,255,0.04)',
                    color: selectedTraceType === b.id ? b.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: selectedTraceType === b.id ? `0 0 0 1px ${b.color}` : 'none'
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Split view */}
            <div className="otel-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Incoming Trace Payload Evaluation
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--ifm-color-content-secondary)' }}>
                  {selectedTraceType === 'error' && (
                    <div>
                      <div style={{ color: '#f87171', fontWeight: 700 }}>MATCH: status_code ERROR policy</div>
                      <div>Root Span: <code>POST /api/checkout</code> (duration: 140ms)</div>
                      <div>Child Span 1: <code>OrderService.createOrder()</code></div>
                      <div>Child Span 2: <code>PaymentClient.charge() ➔ HTTP 500</code></div>
                      <div style={{ marginTop: '8px', color: '#34d399', fontWeight: 700 }}>
                        Decision: KEPT (100% captured for triage)
                      </div>
                    </div>
                  )}
                  {selectedTraceType === 'slow' && (
                    <div>
                      <div style={{ color: '#fbbf24', fontWeight: 700 }}>MATCH: latency threshold &gt; 2000ms</div>
                      <div>Root Span: <code>GET /api/reports/monthly</code> (duration: 2,450ms)</div>
                      <div>Child Span 1: <code>Postgres SELECT * FROM large_table</code> (duration: 2,380ms)</div>
                      <div style={{ marginTop: '8px', color: '#34d399', fontWeight: 700 }}>
                        Decision: KEPT (100% captured for performance tuning)
                      </div>
                    </div>
                  )}
                  {selectedTraceType === 'normal' && (
                    <div>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>MATCH: probabilistic fallback (1%)</div>
                      <div>Root Span: <code>GET /api/products/123</code> (duration: 45ms)</div>
                      <div>Child Span 1: <code>Redis.get('product:123')</code> (duration: 2ms)</div>
                      <div style={{ marginTop: '8px', color: '#a78bfa', fontWeight: 700 }}>
                        Decision: 99% DROPPED (1% sampled to establish latency baseline)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OTel Config YAML */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  OpenTelemetry Collector Contrib YAML
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '6px', fontSize: '10.5px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 50000
    policies:
      - name: errors-policy
        type: status_code
        status_code: { status_codes: [ ERROR ] }
      - name: latency-policy
        type: latency
        latency: { threshold_ms: 2000 }
      - name: probabilistic-sample
        type: probabilistic
        probabilistic: { sampling_percentage: 1.0 }`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COST CALCULATOR */}
        {activeTab === 'cost_calculator' && (
          <div>
            <div className="otel-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  Microservices Traffic & Cost Simulator
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>Throughput (Requests / Second):</span>
                    <strong style={{ color: '#38bdf8' }}>{reqPerSec.toLocaleString()} req/s</strong>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={reqPerSec}
                    onChange={e => setReqPerSec(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>Error Outlier Rate (% of total traffic):</span>
                    <strong style={{ color: '#f87171' }}>{errorRatePercent}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={errorRatePercent}
                    onChange={e => setErrorRatePercent(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f87171' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>Normal Traffic Sampling (%):</span>
                    <strong style={{ color: '#34d399' }}>{sampleRatePercent}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.5"
                    value={sampleRatePercent}
                    onChange={e => setSampleRatePercent(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399' }}
                  />
                </div>
              </div>

              {/* Cost comparison cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #f87171', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>100% Ingestion (No Sampling)</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
                    ${fullCostMonthly.toLocaleString()} / month
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    Generates ~{Math.round(monthlyVolumeTb)} TB/month. Exorbitant cloud storage bill!
                  </div>
                </div>

                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>Head-Based 1% Random Sampling</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                    ${headCostMonthly.toLocaleString()} / month
                  </div>
                  <div style={{ fontSize: '9px', color: '#f87171', marginTop: '2px' }}>
                    Cheap, but <strong>misses 99% of rare 500 errors!</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>Tail-Based Sampling (OTel Collector)</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                    ${tailCostMonthly.toLocaleString()} / month ({Math.round((1 - (tailCostMonthly / fullCostMonthly)) * 100)}% Savings)
                  </div>
                  <div style={{ fontSize: '9px', color: '#34d399', marginTop: '2px' }}>
                    🎯 <strong>Captures 100% of errors & slow requests</strong> while slashing storage volume!
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
