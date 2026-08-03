import React, { useState } from 'react';

const WIREMOCK_STAGES = [
  { step: '1. App Sends HTTP Request', desc: 'Your HTTP client (e.g. RestTemplate, WebClient) sends an actual HTTP request to WireMock at `http://localhost:8089/api/payments/123`.' },
  { step: '2. WireMock Request Matcher', desc: 'WireMock checks incoming URL (`/api/payments/.*`), HTTP Method (`POST`), Headers (`Content-Type: application/json`), and Body regex.' },
  { step: '3. Stub & Response Generator', desc: 'WireMock locates matching stub rule and generates pre-configured response status (200 OK, 500 Error, 429 Rate Limit) or delay.' },
  { step: '4. Verification & Scenario State', desc: 'Records invocation for `verify(postRequestedFor(...))` and transitions state machine (`Scenario.STARTED` ➔ `RETRY_1` ➔ `SUCCESS`).' }
];

export default function WireMockResilienceDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'vs' | 'faults'>('pipeline');
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [selectedFault, setSelectedFault] = useState<'status500' | 'delay' | 'drop' | 'ratelimit'>('status500');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
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
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          WireMock Real HTTP Server Stubbing, Fault Injection & State Machine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'pipeline', label: '🔌 WireMock HTTP Stubbing Pipeline', color: '#fbbf24' },
            { id: 'vs', label: '⚔️ WireMock vs Mockito (HTTP Server vs In-Memory)', color: '#38bdf8' },
            { id: 'faults', label: '⚡ Fault Injection & Resilience Testing Simulator', color: '#f87171' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '150px',
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

        {/* Tab 1: Pipeline */}
        {activeTab === 'pipeline' && (
          <div className="wiremock-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                WIREMOCK STUB MATCHING STAGES:
              </div>

              {WIREMOCK_STAGES.map((st, idx) => {
                const isSel = idx === activeStepIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStepIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? '#fbbf24' : 'var(--ifm-color-content)' }}>
                      {st.step}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-yellow" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
                WireMock HTTP Server Engine
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                {WIREMOCK_STAGES[activeStepIdx].step}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6, margin: 0 }}>
                {WIREMOCK_STAGES[activeStepIdx].desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: WireMock vs Mockito */}
        {activeTab === 'vs' && (
          <div className="wiremock-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>Mockito (In-Memory Java Proxy)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Mocks Java objects inside JVM memory. Tests business logic methods. Fast (milliseconds). Does NOT test HTTP headers, status codes, socket timeouts, or Jackson JSON serialization.
              </p>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>WireMock (Real HTTP Server)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                Starts actual Jetty/HTTP server on localhost. Tests full HTTP client stack (RestTemplate/WebClient/Feign), headers, status codes, retries, timeouts, and network faults.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Fault Injection */}
        {activeTab === 'faults' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'status500', label: '500 Server Error', color: '#f87171' },
                { id: 'delay', label: 'Fixed/Fixed Delay (Timeout)', color: '#fbbf24' },
                { id: 'drop', label: 'Connection Drop Fault', color: '#a78bfa' },
                { id: 'ratelimit', label: '429 Rate Limiting', color: '#38bdf8' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFault(f.id as any)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: selectedFault === f.id ? `${f.color}25` : 'rgba(255,255,255,0.03)',
                    color: selectedFault === f.id ? f.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: selectedFault === f.id ? `0 0 0 1.5px ${f.color}` : 'none'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="interactive-diagram-details-card details-red">
              {selectedFault === 'status500' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171', marginBottom: '6px' }}>500 Internal Server Error Simulation</div>
                  <pre style={{ background: '#090b14', padding: '8px', borderRadius: '6px', color: '#f87171', fontSize: '11px', margin: 0 }}>
                    {`stubFor(get(urlEqualTo("/api/pay")).willReturn(aResponse().withStatus(500)));`}
                  </pre>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', margin: 0 }}>
                    Verifies that your application correctly catches HTTP 5xx errors, logs structured diagnostics, and triggers fallback logic.
                  </p>
                </div>
              )}
              {selectedFault === 'delay' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>Fixed / LogNormal Delay Simulation</div>
                  <pre style={{ background: '#090b14', padding: '8px', borderRadius: '6px', color: '#fbbf24', fontSize: '11px', margin: 0 }}>
                    {`stubFor(get(urlEqualTo("/api/pay")).willReturn(aResponse().withFixedDelay(5000)));`}
                  </pre>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', margin: 0 }}>
                    Injects a 5-second artificial delay to test HTTP socket timeouts (e.g. Resilience4j TimeLimiter / WebClient readTimeout).
                  </p>
                </div>
              )}
              {selectedFault === 'drop' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', marginBottom: '6px' }}>Connection Reset By Peer Fault</div>
                  <pre style={{ background: '#090b14', padding: '8px', borderRadius: '6px', color: '#a78bfa', fontSize: '11px', margin: 0 }}>
                    {`stubFor(get(urlEqualTo("/api/pay")).willReturn(aResponse().withFault(Fault.CONNECTION_RESET_BY_PEER)));`}
                  </pre>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', margin: 0 }}>
                    Simulates TCP connection drops to verify automated client retries and socket reconnection logic.
                  </p>
                </div>
              )}
              {selectedFault === 'ratelimit' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>429 Too Many Requests Rate Limiting</div>
                  <pre style={{ background: '#090b14', padding: '8px', borderRadius: '6px', color: '#38bdf8', fontSize: '11px', margin: 0 }}>
                    {`stubFor(get(urlEqualTo("/api/pay")).willReturn(aResponse().withStatus(429).withHeader("Retry-After", "30")));`}
                  </pre>
                  <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', margin: 0 }}>
                    Simulates rate limits with `Retry-After` headers to verify exponential backoff algorithms.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
