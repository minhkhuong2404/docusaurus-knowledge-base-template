import React, { useState } from 'react';

type ResilienceTab = 'k8s_probes' | 'exception_handler' | 'multi_instance';

export default function KafkaStreamsTopologyResilienceDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ResilienceTab>('k8s_probes');
  const [probeScenario, setProbeScenario] = useState<'coupled' | 'decoupled'>('decoupled');
  const [exceptionAction, setExceptionAction] = useState<'replace' | 'shutdown_client' | 'shutdown_app'>('replace');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-resilience-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Fault Tolerance & Service Uptime Guardrails
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'k8s_probes', label: '1. K8s Probe Decoupling (No CrashLoops)', color: '#34d399' },
            { id: 'exception_handler', label: '2. Uncaught Exception Handler', color: '#38bdf8' },
            { id: 'multi_instance', label: '3. Multi-Engine JVM Isolation', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ResilienceTab)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11.5px',
                background: activeTab === t.id ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* SVG Flow Canvas with Moving Arrows */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="res-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="res-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
              <marker id="res-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="res-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
            </defs>

            {activeTab === 'k8s_probes' && (
              <g>
                <rect x="25" y="45" width="130" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="90" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Kubelet Controller</text>
                <text x="90" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Health Poller (10s)</text>

                {probeScenario === 'coupled' ? (
                  <>
                    <line x1="155" y1="75" x2="260" y2="75" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                    <line x1="155" y1="75" x2="260" y2="75" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#res-arr-red)" />

                    <rect x="265" y="45" width="180" height="60" rx="8" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.5" />
                    <text x="355" y="70" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Liveness = Streams State</text>
                    <text x="355" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">State != RUNNING ➔ 503 FAIL</text>

                    <line x1="445" y1="75" x2="525" y2="75" stroke="rgba(248,113,113,0.3)" strokeWidth="2" />
                    <line x1="445" y1="75" x2="525" y2="75" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#res-arr-red)" />

                    <rect x="530" y="45" width="125" height="60" rx="8" fill="rgba(248,113,113,0.2)" stroke="#f87171" strokeWidth="1.5" />
                    <text x="592" y="70" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="800">💥 SIGKILL Pod</text>
                    <text x="592" y="88" textAnchor="middle" fill="#fca5a5" fontSize="9">CrashLoopBackOff!</text>
                  </>
                ) : (
                  <>
                    {/* Path to Liveness (JVM) */}
                    <path d="M 155 65 L 265 35" stroke="rgba(52,211,153,0.3)" strokeWidth="2" fill="none" />
                    <path d="M 155 65 L 265 35" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#res-arr-green)" />

                    <rect x="270" y="10" width="180" height="50" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="360" y="32" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Liveness (/health/live)</text>
                    <text x="360" y="48" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">JVM Alive ➔ 200 OK (Keep Alive)</text>

                    {/* Path to Readiness (Traffic) */}
                    <path d="M 155 85 L 265 115" stroke="rgba(251,191,36,0.3)" strokeWidth="2" fill="none" />
                    <path d="M 155 85 L 265 115" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#res-arr-amber)" />

                    <rect x="270" y="90" width="180" height="50" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="360" y="112" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Readiness (/health/ready)</text>
                    <text x="360" y="128" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Streams != RUNNING ➔ 503 Drop Traffic</text>

                    <rect x="495" y="45" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="575" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Container Survives</text>
                    <text x="575" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Allows v2 rollout to heal</text>
                  </>
                )}
              </g>
            )}

            {activeTab === 'exception_handler' && (
              <g>
                <rect x="20" y="45" width="125" height="60" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="82" y="70" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">TaskAssignmentEx</text>
                <text x="82" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Thread Error Fired</text>

                <line x1="145" y1="75" x2="220" y2="75" stroke="rgba(56,189,248,0.3)" strokeWidth="2" />
                <line x1="145" y1="75" x2="220" y2="75" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#res-arr-blue)" />

                <rect x="225" y="45" width="170" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="310" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">UncaughtExceptionHandler</text>
                <text x="310" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                  {exceptionAction === 'replace' ? 'REPLACE_THREAD' : exceptionAction === 'shutdown_client' ? 'SHUTDOWN_CLIENT' : 'SHUTDOWN_APPLICATION'}
                </text>

                <line x1="395" y1="75" x2="470" y2="75" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="395" y1="75" x2="470" y2="75" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#res-arr-green)" />

                <rect x="475" y="45" width="180" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="565" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
                  {exceptionAction === 'replace' ? 'Spawns Fresh Thread' : exceptionAction === 'shutdown_client' ? 'Streams Stop, Web Stays' : 'Full JVM Process Exit'}
                </text>
                <text x="565" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                  {exceptionAction === 'replace' ? 'Retries clean assignment' : exceptionAction === 'shutdown_client' ? 'REST API stays 200 OK' : 'Triggers Pod Termination'}
                </text>
              </g>
            )}

            {activeTab === 'multi_instance' && (
              <g>
                <rect x="25" y="15" width="160" height="50" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="105" y="37" textAnchor="middle" fill="#f87171" fontSize="10.5" fontWeight="700">Engine A: Orders (Broken)</text>
                <text x="105" y="53" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">App ID: "order-stream-v2"</text>

                <rect x="25" y="85" width="160" height="50" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="105" y="107" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">Engine B: Payments (Healthy)</text>
                <text x="105" y="123" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">App ID: "pay-stream-v1"</text>

                <path d="M 185 40 L 290 65" stroke="rgba(248,113,113,0.3)" strokeWidth="2" fill="none" />
                <path d="M 185 110 L 290 85" stroke="rgba(52,211,153,0.3)" strokeWidth="2" fill="none" />
                <path d="M 185 110 L 290 85" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#res-arr-green)" />

                <rect x="295" y="45" width="180" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="385" y="70" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Shared Spring / JVM Container</text>
                <text x="385" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Isolated Failure Domains</text>

                <line x1="475" y1="75" x2="535" y2="75" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
                <line x1="475" y1="75" x2="535" y2="75" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#res-arr-green)" />

                <rect x="540" y="45" width="115" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="597" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">REST API 200</text>
                <text x="597" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">100% Online</text>
              </g>
            )}
          </svg>
        </div>

        {/* Split Details Grid */}
        <div className="kstreams-resilience-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', alignItems: 'start' }}>
          {/* Left Controls / Selector Panel */}
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
              SCENARIO CONFIGURATION
            </div>

            {activeTab === 'k8s_probes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setProbeScenario('coupled')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textAlign: 'left',
                    background: probeScenario === 'coupled' ? '#f8717122' : 'rgba(255,255,255,0.03)',
                    color: probeScenario === 'coupled' ? '#f87171' : 'var(--ifm-color-content)',
                    boxShadow: probeScenario === 'coupled' ? '0 0 0 1.5px #f87171' : 'none'
                  }}
                >
                  ❌ Anti-Pattern: Coupled Liveness Probe
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Liveness checks <code>kafkaStreams.state() == RUNNING</code>. Pod is killed on rebalance.
                  </div>
                </button>

                <button
                  onClick={() => setProbeScenario('decoupled')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textAlign: 'left',
                    background: probeScenario === 'decoupled' ? '#34d39922' : 'rgba(255,255,255,0.03)',
                    color: probeScenario === 'decoupled' ? '#34d399' : 'var(--ifm-color-content)',
                    boxShadow: probeScenario === 'decoupled' ? '0 0 0 1.5px #34d399' : 'none'
                  }}
                >
                  ✅ Best Practice: Decoupled Probes
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Liveness checks JVM (/live), Readiness checks Streams (/ready). Container never killed!
                  </div>
                </button>
              </div>
            )}

            {activeTab === 'exception_handler' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { id: 'replace', label: 'REPLACE_THREAD (Recommended for transient mismatch)', desc: 'Kills failing thread and spawns a replacement to retry assignment.' },
                  { id: 'shutdown_client', label: 'SHUTDOWN_CLIENT (Graceful Degradation)', desc: 'Stops Kafka Streams engine while keeping HTTP server & JVM alive.' },
                  { id: 'shutdown_app', label: 'SHUTDOWN_APPLICATION (Hard Failover)', desc: 'Terminates entire JVM process immediately.' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setExceptionAction(opt.id as any)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'left',
                      background: exceptionAction === opt.id ? '#38bdf822' : 'rgba(255,255,255,0.03)',
                      color: exceptionAction === opt.id ? '#38bdf8' : 'var(--ifm-color-content)',
                      boxShadow: exceptionAction === opt.id ? '0 0 0 1.5px #38bdf8' : 'none'
                    }}
                  >
                    {opt.label}
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'multi_instance' && (
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  Instead of putting multiple sub-topologies into one monolithic <code>StreamsBuilder</code>, instantiate separate <code>KafkaStreams</code> objects with unique <code>application.id</code>s in the same JVM container.
                </p>
                <div style={{ background: 'rgba(167,139,250,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #a78bfa' }}>
                  <strong style={{ color: '#a78bfa' }}>Blast Radius:</strong> An error in Orders stream engine never crashes Payments or your web controller layer.
                </div>
              </div>
            )}
          </div>

          {/* Right Details Panel */}
          <div className="interactive-diagram-details-card details-green" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              PRODUCTION ARCHITECTURAL IMPACT
            </div>

            {activeTab === 'k8s_probes' && (
              <>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                  {probeScenario === 'coupled' ? 'Why Coupled Probes Cause Cluster Death' : 'How Decoupled Probes Save Rolling Updates'}
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                  {probeScenario === 'coupled'
                    ? 'When Liveness checks Kafka Streams state, transient rebalances cause Kubernetes to send SIGKILL. Every restarted pod rejoins the consumer group and triggers another rebalance, locking all pods in an eternal CrashLoopBackOff.'
                    : 'By separating Liveness (JVM alive = 200 OK) from Readiness (Streams running = 200 OK), Kubernetes stops external HTTP traffic during rebalances but NEVER kills the pod. This allows rolling updates to finish cleanly.'}
                </p>
              </>
            )}

            {activeTab === 'exception_handler' && (
              <>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                  StreamsUncaughtExceptionHandler (KIP-663)
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                  Standard Java threads die silently when unhandled exceptions occur. Using <code>setUncaughtExceptionHandler</code> ensures that if a topology validation failure occurs, your application explicitly chooses how to react instead of dropping into undefined thread-starvation states.
                </p>
              </>
            )}

            {activeTab === 'multi_instance' && (
              <>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                  Decoupled Stream Engines in a Single Service
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                  Each <code>KafkaStreams</code> instance forms its own isolated consumer group. Rebalancing, state store recreation, or metadata mismatch in Service A does not trigger partition revocations in Service B.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
