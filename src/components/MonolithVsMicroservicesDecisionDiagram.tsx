import React, { useState } from 'react';

type ArchTab = 'architecture' | 'complexity_tax' | 'decision_engine' | 'checklist';

export default function MonolithVsMicroservicesDecisionDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ArchTab>('architecture');
  const [activeView, setActiveView] = useState<'monolith' | 'microservices'>('monolith');

  // Decision engine state
  const [teamSize, setTeamSize] = useState<number>(6);
  const [independentScaling, setIndependentScaling] = useState<boolean>(false);
  const [domainClear, setDomainClear] = useState<boolean>(false);
  const [devOpsMaturity, setDevOpsMaturity] = useState<boolean>(false);

  // Calculate recommendation
  const score = (teamSize >= 30 ? 2 : 0) + 
                (independentScaling ? 2 : 0) + 
                (domainClear ? 1 : -2) + 
                (devOpsMaturity ? 1 : -2);

  const isMicroservicesRecommended = score >= 3;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .monolith-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Senior Architecture Blueprint: Modular Monolith vs. Microservices Tax
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '🏛️ Architecture Comparison', color: '#f97316' },
            { id: 'complexity_tax', label: '💸 The Distributed Tax', color: '#f87171' },
            { id: 'decision_engine', label: '🧮 Senior Decision Engine', color: '#34d399' },
            { id: 'checklist', label: '📋 Pragmatism Audit', color: '#38bdf8' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ArchTab)}
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
        {/* TAB 1: ARCHITECTURE COMPARISON */}
        {activeTab === 'architecture' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setActiveView('monolith')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${activeView === 'monolith' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  background: activeView === 'monolith' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: activeView === 'monolith' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🏢 The Modular Monolith (Senior Simplicity)
              </button>
              <button
                onClick={() => setActiveView('microservices')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${activeView === 'microservices' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  background: activeView === 'microservices' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: activeView === 'microservices' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🕸️ Microservices Sprawl (Resume-Driven Trap)
              </button>
            </div>

            {/* SVG Visual Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="tax-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="tax-arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
                  </marker>
                </defs>

                {activeView === 'monolith' ? (
                  <g transform="translate(20, 20)">
                    {/* User Request */}
                    <rect x="0" y="55" width="130" height="70" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" />
                    <text x="12" y="80" fill="#38bdf8" fontSize="11" fontWeight="700">Client / Browser</text>
                    <text x="12" y="100" fill="#94a3b8" fontSize="8.5">Single HTTPS Port</text>

                    <path d="M 135 90 L 195 90" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#tax-arrow-green)" className="interactive-diagram-flowing-path" />

                    {/* Single Modular Monolith Box */}
                    <rect x="200" y="10" width="370" height="150" rx="8" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="2" />
                    <text x="215" y="32" fill="#34d399" fontSize="12" fontWeight="800">Single Deployable Application (1 JVM / Container)</text>

                    {/* Module A */}
                    <rect x="215" y="45" width="105" height="60" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" />
                    <text x="223" y="66" fill="#ffffff" fontSize="9.5" fontWeight="700">Order Module</text>
                    <text x="223" y="82" fill="#86efac" fontSize="7.5">In-memory call</text>

                    {/* Direct Memory Call Arrow */}
                    <path d="M 325 75 L 345 75" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#tax-arrow-green)" />

                    {/* Module B */}
                    <rect x="350" y="45" width="105" height="60" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" />
                    <text x="358" y="66" fill="#ffffff" fontSize="9.5" fontWeight="700">Payment Module</text>
                    <text x="358" y="82" fill="#86efac" fontSize="7.5">Zero network hop</text>

                    {/* Direct Memory Call Arrow */}
                    <path d="M 460 75 L 480 75" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#tax-arrow-green)" />

                    {/* Module C */}
                    <rect x="485" y="45" width="75" height="60" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke="#34d399" />
                    <text x="492" y="66" fill="#ffffff" fontSize="9.5" fontWeight="700">Audit</text>
                    <text x="492" y="82" fill="#86efac" fontSize="7.5">Local event</text>

                    <rect x="215" y="115" width="345" height="32" rx="4" fill="rgba(52, 211, 153, 0.15)" />
                    <text x="225" y="134" fill="#a7f3d0" fontSize="9" fontWeight="700">⚡ Transaction Boundary: 1 ACID DB Commit (0% Distributed Rollback)</text>

                    {/* DB Arrow */}
                    <path d="M 575 90 L 635 90" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#tax-arrow-green)" className="interactive-diagram-flowing-path" />

                    {/* Database */}
                    <rect x="640" y="35" width="140" height="100" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="655" y="65" fill="#34d399" fontSize="12" fontWeight="700">🗄️ PostgreSQL</text>
                    <text x="655" y="85" fill="#e2e8f0" fontSize="8.5">• ACID guarantees</text>
                    <text x="655" y="100" fill="#e2e8f0" fontSize="8.5">• Foreign keys intact</text>
                    <text x="655" y="115" fill="#86efac" fontSize="8.5">• $20/month VPS</text>
                  </g>
                ) : (
                  <g transform="translate(20, 20)">
                    {/* User Request */}
                    <rect x="0" y="55" width="110" height="70" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" />
                    <text x="10" y="80" fill="#38bdf8" fontSize="11" fontWeight="700">Client</text>
                    <text x="10" y="100" fill="#94a3b8" fontSize="8">API Gateway</text>

                    <path d="M 115 90 L 155 90" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#tax-arrow-red)" className="interactive-diagram-flowing-path" />

                    {/* Service 1 */}
                    <rect x="160" y="20" width="130" height="70" rx="6" fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" />
                    <text x="170" y="42" fill="#f87171" fontSize="10" fontWeight="700">Order Service (K8s)</text>
                    <text x="170" y="60" fill="#ffffff" fontSize="8">Pod 1</text>
                    <text x="170" y="74" fill="#fca5a5" fontSize="7.5">gRPC / HTTP Timeout?</text>

                    {/* Hop 1 */}
                    <path d="M 295 55 L 345 55" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#tax-arrow-red)" />
                    <text x="300" y="48" fill="#fbbf24" fontSize="7">15ms latency</text>

                    {/* Service 2 */}
                    <rect x="350" y="20" width="130" height="70" rx="6" fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" />
                    <text x="360" y="42" fill="#f87171" fontSize="10" fontWeight="700">Payment Service</text>
                    <text x="360" y="60" fill="#ffffff" fontSize="8">Pod 2</text>
                    <text x="360" y="74" fill="#fca5a5" fontSize="7.5">Distributed Lock?</text>

                    {/* Hop to Kafka */}
                    <path d="M 485 55 L 535 55" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#tax-arrow-red)" />

                    {/* Kafka Cluster */}
                    <rect x="540" y="10" width="110" height="90" rx="6" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" />
                    <text x="550" y="32" fill="#fbbf24" fontSize="10" fontWeight="700">Kafka Quorum</text>
                    <text x="550" y="50" fill="#ffffff" fontSize="8">3 Brokers</text>
                    <text x="550" y="66" fill="#fde047" fontSize="7.5">Dual-Write Trap</text>
                    <text x="550" y="82" fill="#fde047" fontSize="7.5">Outbox Worker</text>

                    {/* Service 3 */}
                    <rect x="660" y="20" width="130" height="70" rx="6" fill="rgba(248, 113, 113, 0.1)" stroke="#f87171" />
                    <text x="670" y="42" fill="#f87171" fontSize="10" fontWeight="700">Audit Service</text>
                    <text x="670" y="60" fill="#ffffff" fontSize="8">Pod 3</text>
                    <text x="670" y="74" fill="#fca5a5" fontSize="7.5">Eventual Consistency</text>

                    {/* Distributed Overhead Bar */}
                    <rect x="160" y="115" width="630" height="40" rx="4" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeDasharray="2 2" />
                    <text x="175" y="132" fill="#fca5a5" fontSize="9" fontWeight="700">💸 Complexity Tax: 3 DBs, Istio Service Mesh, Jaeger Tracing, 3 CI/CD Pipelines</text>
                    <text x="175" y="146" fill="#ffffff" fontSize="8.5">⚠️ If Step 2 fails after Kafka write ➔ 2PC / Saga rollback required across network!</text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLEXITY TAX */}
        {activeTab === 'complexity_tax' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {[
              {
                title: '1. Network Latency & Cascading Failures',
                color: '#f87171',
                desc: 'In a monolith, calling another module takes 10 nanoseconds (in-memory pointer). In microservices, every call is a network packet across TCP/HTTP (10-50ms) vulnerable to socket timeouts, connection drops, and cascading thread pool exhaustion.'
              },
              {
                title: '2. The Dual-Write & Saga Tax',
                color: '#fbbf24',
                desc: 'You can no longer use a simple database transaction `BEGIN ... COMMIT`. Updating Order and Inventory requires distributed 2-Phase Commit (2PC), Transactional Outbox patterns, or Saga compensations that can leave state permanently corrupted.'
              },
              {
                title: '3. Observability & Debugging Nightmare',
                color: '#f97316',
                desc: 'Tracing a single bug requires correlating OpenTelemetry trace IDs across 8 services, centralized Elasticsearch log clusters, and distributed APM tools. In a monolith, you follow a single stack trace to the exact line of code in 30 seconds.'
              },
              {
                title: '4. DevOps & Cloud Cost Explosion',
                color: '#a855f7',
                desc: 'Instead of 1 CI/CD pipeline and 1 deployment target, you maintain 15 Dockerfiles, 15 Helm charts, service meshes (Istio/Linkerd), API gateways, and cloud bills running idle pods across multiple availability zones.'
              }
            ].map(tax => (
              <div key={tax.title} style={{ padding: '14px', background: `${tax.color}08`, border: `1px solid ${tax.color}25`, borderRadius: '8px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: tax.color, marginBottom: '6px' }}>{tax.title}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>{tax.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: SENIOR DECISION ENGINE */}
        {activeTab === 'decision_engine' && (
          <div className="monolith-split-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
                Simulate Your Team's Constraints:
              </div>

              {/* Slider: Team Size */}
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                  <span>Engineering Team Size (Conway's Law):</span>
                  <strong style={{ color: '#38bdf8' }}>{teamSize} Engineers</strong>
                </div>
                <input
                  type="range"
                  min="2"
                  max="100"
                  value={teamSize}
                  onChange={e => setTeamSize(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Rule: Teams under 20 engineers suffer a net velocity loss from microservice coordination.
                </div>
              </div>

              {/* Toggles */}
              {[
                { label: 'Workload requires radically different hardware (e.g. GPU AI / Video Transcode)?', val: independentScaling, set: setIndependentScaling },
                { label: 'Domain boundaries and bounded contexts are 100% frozen & mature?', val: domainClear, set: setDomainClear },
                { label: 'Dedicated 24/7 Platform / SRE team in place to manage K8s & Mesh?', val: devOpsMaturity, set: setDevOpsMaturity }
              ].map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => t.set(!t.val)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: t.val ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${t.val ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <input type="checkbox" checked={t.val} readOnly style={{ cursor: 'pointer' }} />
                  <span style={{ fontSize: '11.5px', color: t.val ? '#34d399' : 'var(--ifm-color-content)' }}>{t.label}</span>
                </div>
              ))}
            </div>

            {/* Recommendation Result Card */}
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: isMicroservicesRecommended ? 'rgba(248, 113, 113, 0.08)' : 'rgba(52, 211, 153, 0.08)',
              border: `1.5px solid ${isMicroservicesRecommended ? '#f87171' : '#34d399'}`
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: isMicroservicesRecommended ? '#f87171' : '#34d399', marginBottom: '6px' }}>
                Senior Recommendation:
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: isMicroservicesRecommended ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                {isMicroservicesRecommended ? '⚠️ Microservices Justified with Strict Discipline' : '🏛️ Stay with a Modular Monolith!'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px' }}>
                {isMicroservicesRecommended
                  ? 'Your team size and hardware scaling demands justify the overhead of distributed systems. Ensure you extract ONLY the specialized service while keeping core business domain logic unified.'
                  : 'Adopting microservices now would be Resume-Driven Development (RDD). A modular monolith with clear package boundaries will allow your team to ship 5× faster with 90% fewer outages.'}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Senior Golden Rule:</strong> Never split an application to fix code quality issues. If you cannot build a clean monolith, you will inevitably build a distributed unmaintainable mess.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRAGMATISM AUDIT */}
        {activeTab === 'checklist' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '14px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                ✅ What Actually Proves You Are a Senior Engineer:
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Solving business requirements with the <strong>simplest possible architecture</strong>.</li>
                <li>Designing strict module boundaries (Hexagonal / Ports & Adapters) inside a single codebase.</li>
                <li>Keeping the cloud bill at $50/month instead of $5,000/month while hitting 99.99% SLA.</li>
                <li>Choosing boring, battle-tested technologies (Postgres, monolith) over trendy hype.</li>
                <li>Writing clean code that a teammate can debug at 3 AM in 5 minutes.</li>
              </ul>
            </div>

            <div style={{ padding: '14px', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
                ❌ What Fools Fake Seniority (Resume-Driven Habits):
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Splitting an application with 5,000 daily users into 12 microservices.</li>
                <li>Adding Kafka, Kubernetes, and Istio when Postgres queues and a single VPS suffice.</li>
                <li>Letting AI generate complex architectures without validating operational tradeoffs.</li>
                <li>Creating distributed transactions (Sagas) because "monoliths feel old-fashioned".</li>
                <li>Leaving an unmaintainable distributed maze for other engineers to untangle.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
