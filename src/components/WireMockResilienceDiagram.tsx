import React, { useState } from 'react';

const WIREMOCK_FAULTS = [
  { id: 'status500', name: 'HTTP 500 Internal Error', desc: 'Simulates payment gateway crash, triggering application CircuitBreaker / Retry logic.', code: `stubFor(post(urlEqualTo("/api/payments"))\n  .willReturn(aResponse()\n    .withStatus(500)\n    .withBody("{\\"error\\": \\"Service Unavailable\\"}")));` },
  { id: 'delay', name: 'Network Latency / Timeout', desc: 'Injects fixed or random delay (e.g. 3000ms) to test socket timeout thresholds.', code: `stubFor(get(urlMatching("/api/orders/.*"))\n  .willReturn(aResponse()\n    .withFixedDelay(3000)\n    .withStatus(200)));` },
  { id: 'drop', name: 'Fault: Connection Reset / Drop', desc: 'Simulates socket connection drop (RST packet) or sending garbage byte headers.', code: `stubFor(get(urlEqualTo("/api/data"))\n  .willReturn(aResponse()\n    .withFault(Fault.CONNECTION_RESET_BY_PEER)));` },
  { id: 'ratelimit', name: 'HTTP 429 Too Many Requests', desc: 'Simulates upstream third-party rate limit with Retry-After backoff headers.', code: `stubFor(post(urlEqualTo("/api/sms"))\n  .willReturn(aResponse()\n    .withStatus(429)\n    .withHeader("Retry-After", "5")));` }
];

export default function WireMockResilienceDiagram({ initialTab = 'pipeline' }: { initialTab?: 'pipeline' | 'vs' | 'faults' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'vs' | 'faults'>(initialTab);
  const [selectedFaultId, setSelectedFaultId] = useState<string>('status500');

  const currFault = WIREMOCK_FAULTS.find(f => f.id === selectedFaultId)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .wiremock-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          WireMock Real HTTP Server Stubbing, Fault Injection & State Machine
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '🔌 HTTP Stubbing Pipeline', color: '#fbbf24' },
            { id: 'vs', label: '⚔️ WireMock vs Mockito', color: '#38bdf8' },
            { id: 'faults', label: '⚡ Fault Injection Simulator', color: '#f87171' }
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* SVG Flow Canvas (Common for Pipeline & Faults) */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="wm-arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fbbf24" />
              </marker>
              <marker id="wm-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
              <marker id="wm-arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
              </marker>
            </defs>

            {activeTab !== 'vs' && (
              <g transform="translate(15, 20)">
                {/* 1. App Under Test */}
                <rect x="0" y="30" width="180" height="90" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="15" y="55" fill="#38bdf8" fontSize="11" fontWeight="700">1. Spring Boot App</text>
                <text x="15" y="75" fill="#e2e8f0" fontSize="9">RestTemplate / WebClient</text>
                <text x="15" y="95" fill="#93c5fd" fontSize="8">Target: localhost:8089</text>
                <text x="15" y="108" fill="#94a3b8" fontSize="7.5">Real HTTP Network Socket</text>

                {/* Flow to WireMock */}
                <path d="M 185 75 L 255 75" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#wm-arrow-amber)" className="interactive-diagram-flowing-path" />
                <text x="190" y="65" fill="#fbbf24" fontSize="8" fontWeight="700">HTTP POST</text>

                {/* 2. WireMock HTTP Server Boundary */}
                <rect x="260" y="10" width="310" height="135" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="275" y="34" fill="#fbbf24" fontSize="11" fontWeight="700">2. WireMock Server (:8089)</text>

                <rect x="275" y="46" width="280" height="36" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                <text x="285" y="68" fill="#ffffff" fontSize="9" fontWeight="700">URL / Header / Body Matcher</text>

                <rect x="275" y="92" width="280" height="42" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="285" y="110" fill="#34d399" fontSize="9" fontWeight="700">Stub Response & Scenario State</text>
                <text x="285" y="124" fill="#86efac" fontSize="7.5">Dynamic templating & latency simulation</text>

                {/* Response Flow */}
                <path d="M 575 75 L 645 75" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#wm-arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="580" y="65" fill="#34d399" fontSize="8" fontWeight="700">HTTP Response</text>

                {/* 3. Verification */}
                <rect x="650" y="30" width="140" height="90" rx="8" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="662" y="55" fill="#34d399" fontSize="11" fontWeight="700">3. Verification</text>
                <text x="662" y="75" fill="#e2e8f0" fontSize="8.5">verify(postRequestedFor)</text>
                <text x="662" y="95" fill="#86efac" fontSize="8">• Count: times(1)</text>
                <text x="662" y="108" fill="#86efac" fontSize="8">• Header assertions</text>
              </g>
            )}

            {activeTab === 'vs' && (
              <g transform="translate(15, 20)">
                <rect x="0" y="15" width="370" height="125" rx="8" fill="rgba(56, 189, 248, 0.1)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="20" y="40" fill="#38bdf8" fontSize="12" fontWeight="700">Mockito (In-Memory Java Proxy)</text>
                <text x="20" y="65" fill="#e2e8f0" fontSize="9">• Stubs Java method calls in JVM memory</text>
                <text x="20" y="85" fill="#e2e8f0" fontSize="9">• 0% network socket / serialization testing</text>
                <text x="20" y="105" fill="#93c5fd" fontSize="8.5">• ⚡ Runs in milliseconds (Best for Unit Tests)</text>

                <rect x="410" y="15" width="370" height="125" rx="8" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="430" y="40" fill="#fbbf24" fontSize="12" fontWeight="700">WireMock (Real HTTP Server)</text>
                <text x="430" y="65" fill="#e2e8f0" fontSize="9">• Spawns real local HTTP socket on port</text>
                <text x="430" y="85" fill="#e2e8f0" fontSize="9">• Validates JSON serialization, headers, status codes</text>
                <text x="430" y="105" fill="#fef08a" fontSize="8.5">• 🐢 Runs in seconds (Best for Integration Tests)</text>
              </g>
            )}
          </svg>
        </div>

        {/* Tab 1: Pipeline Details */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>1. True HTTP Wire Testing</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                WireMock receives actual TCP packets, allowing you to catch serialization mismatches, incorrect HTTP verbs, and missing auth headers.
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>2. Stateful Scenarios</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                Model state machines (e.g. 1st call returns 500, 2nd call returns 200) to test retry logic and idempotent consumers.
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>3. Testcontainers Ready</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                Runs embedded or inside lightweight Docker containers (`wiremock/wiremock`) for hermetic CI pipeline runs.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Vs Comparison */}
        {activeTab === 'vs' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ padding: '14px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>When to use Mockito:</div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                <li>Testing internal business rules in `@Service` beans.</li>
                <li>Unit tests where you want sub-millisecond execution.</li>
                <li>When mocking local helper methods and data repositories.</li>
              </ul>
            </div>

            <div style={{ padding: '14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>When to use WireMock:</div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '16px', lineHeight: 1.5 }}>
                <li>Testing third-party payment gateways (Stripe, PayPal).</li>
                <li>Testing HTTP timeouts, connection drops, and backoff retries.</li>
                <li>Validating Spring Cloud Contract consumer-driven contracts.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Fault Injection Simulator */}
        {activeTab === 'faults' && (
          <div className="wiremock-grid" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '14px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                SELECT FAULT SIMULATION:
              </div>
              {WIREMOCK_FAULTS.map(f => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFaultId(f.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: selectedFaultId === f.id ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedFaultId === f.id ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: selectedFaultId === f.id ? '#f87171' : 'var(--ifm-color-content)' }}>
                    {f.name}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid #f87171', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                {currFault.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4, marginBottom: '10px' }}>
                {currFault.desc}
              </div>
              <pre style={{ margin: 0, fontSize: '11px', color: '#fca5a5', fontFamily: 'monospace', background: '#090b14', padding: '10px', borderRadius: '6px' }}>
                <code>{currFault.code}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
