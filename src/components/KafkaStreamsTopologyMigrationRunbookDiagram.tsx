import React, { useState } from 'react';

type StrategyType = 'blue_green' | 'cold_reset' | 'decouple' | 'append_only';

export default function KafkaStreamsTopologyMigrationRunbookDiagram({ initialStrategy = 'blue_green' }: { initialStrategy?: StrategyType }): React.JSX.Element {
  const [strategy, setStrategy] = useState<StrategyType>(initialStrategy);
  const [activeStep, setActiveStep] = useState<number>(0);

  const strategies = {
    blue_green: {
      name: '1. Blue-Green Cutover (Zero Downtime)',
      badge: 'Gold Standard (0ms Downtime)',
      badgeColor: '#34d399',
      overview: 'Increment application.id (e.g. app-v2), deploy alongside v1, wait for full catch-up, then cut over traffic.',
      steps: [
        { title: 'Step 1: Increment application.id', detail: 'Set application.id = "order-service-v2". Creates independent consumer group and separate changelog topics.', icon: '🏷️' },
        { title: 'Step 2: Dual Run & Catch-Up', detail: 'Deploy v2 pods. v2 builds RocksDB state in background while v1 serves active live production traffic.', icon: '🔄' },
        { title: 'Step 3: Verify Lag = 0', detail: 'Monitor consumer group lag on v2 until catch-up is complete (offset lag < 100 records).', icon: '📊' },
        { title: 'Step 4: Switch Traffic & Terminate v1', detail: 'Route API / downstream consumers to v2 output topics. Scale v1 deployment to 0 replicas.', icon: '🔀' },
        { title: 'Step 5: Purge Orphaned v1 Topics', detail: 'Run kafka-topics.sh --delete on old v1 changelog and repartition internal topics.', icon: '🧹' }
      ]
    },
    cold_reset: {
      name: '2. Cold Reset & Disk Purge (Same ID)',
      badge: 'Requires Maintenance Window',
      badgeColor: '#fbbf24',
      overview: 'Scale instances to 0, run application-reset tool, purge local RocksDB disk storage, and deploy v2.',
      steps: [
        { title: 'Step 1: Scale Deployment to 0', detail: 'kubectl scale deployment order-service --replicas=0 (Ensure group state is DEAD/EMPTY).', cmd: 'kubectl scale deployment order-service --replicas=0' },
        { title: 'Step 2: Application Reset Tool', detail: 'Reset input offsets and clean internal repartition topics using kafka-streams-application-reset.', cmd: 'kafka-streams-application-reset --bootstrap-servers localhost:9092 --application-id order-service --input-topics orders-raw --intermediate-topics order-service-repartition' },
        { title: 'Step 3: Delete Obsolete Changelogs', detail: 'Delete Kafka changelog topics belonging to removed state stores.', cmd: 'kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic order-service-deprecated-store-changelog' },
        { title: 'Step 4: Wipe Local Host/PVC Storage', detail: 'Purge /var/data/kafka-streams/order-service/* on all host volumes to remove stale SSTable directories.', cmd: 'rm -rf /var/data/kafka-streams/order-service/*' },
        { title: 'Step 5: Deploy & Start v2 Instances', detail: 'Scale up v2 pods. Sub-topology 0 initialized cleanly from offset 0 without task collisions.', cmd: 'kubectl scale deployment order-service --replicas=3' }
      ]
    },
    decouple: {
      name: '3. Microservice Architectural Split',
      badge: 'Best Long-Term Architecture',
      badgeColor: '#38bdf8',
      overview: 'Split independent sub-topologies into separate Kafka Streams microservices with distinct application.ids.',
      steps: [
        { title: 'Order Enrichment Service', detail: 'application.id = "order-enrichment-app". Scales and deploys independently.', icon: '📦' },
        { title: 'Payment Processing Service', detail: 'application.id = "payment-processing-app". Changes to payments topology never cause rebalances in orders.', icon: '💳' },
        { title: 'Isolated Failure Domains', detail: 'A state rebuild or crash in payments service has zero operational impact on orders pipeline.', icon: '🛡️' }
      ]
    },
    append_only: {
      name: '4. Append-Only Dummy Stub Migration',
      badge: 'Rolling Upgrade Without ID Change',
      badgeColor: '#a78bfa',
      overview: 'Never delete or reorder existing sub-topology slots. Replace retired pipelines with dummy no-op stubs to keep indices stable.',
      steps: [
        { title: 'Slot 0 (Retired Pipeline)', detail: 'builder.stream("deprecated-topic").filter((k,v) -> false) — holds index 0 slot with 0 overhead.', icon: '🛑' },
        { title: 'Slot 1 (Active Pipeline)', detail: 'Payments pipeline remains at index 1 — Task IDs 1_0, 1_1 remain 100% stable across rolling restarts.', icon: '✅' },
        { title: 'Slot 2 (New Pipeline)', detail: 'Add new sub-topologies only at the very end of StreamsBuilder (index 2+).', icon: '➕' }
      ]
    }
  };

  const curr = strategies[strategy];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-runbook-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive Topology Migration & Decommissioning Runbook
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Strategy Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'blue_green', label: '1. Blue-Green Cutover (0 Downtime)', color: '#34d399' },
            { id: 'cold_reset', label: '2. Cold Reset & Disk Purge', color: '#fbbf24' },
            { id: 'decouple', label: '3. Microservice Decoupling', color: '#38bdf8' },
            { id: 'append_only', label: '4. Append-Only Dummy Stub', color: '#a78bfa' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => { setStrategy(s.id as StrategyType); setActiveStep(0); }}
              style={{
                flex: 1,
                minWidth: '170px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11.5px',
                background: strategy === s.id ? `${s.color}22` : 'rgba(255,255,255,0.04)',
                color: strategy === s.id ? s.color : 'var(--ifm-color-content-secondary)',
                boxShadow: strategy === s.id ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Top Interactive SVG Flow with Moving Arrows */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' }}>
          <svg viewBox="0 0 680 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="runbook-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="runbook-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="runbook-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
              <marker id="runbook-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
              <marker id="runbook-arr-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
              </marker>
            </defs>

            {strategy === 'blue_green' && (
              <g>
                {/* Upstream Kafka Input Topic */}
                <rect x="25" y="60" width="120" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="85" y="86" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Input Topic</text>
                <text x="85" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">orders-raw</text>

                {/* Flow to v1 */}
                <path d="M 145 75 L 255 45" stroke="rgba(248,113,113,0.3)" strokeWidth="2" fill="none" />
                {activeStep < 3 ? (
                  <path d="M 145 75 L 255 45" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-red)" />
                ) : (
                  <path d="M 145 75 L 255 45" stroke="rgba(248,113,113,0.2)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                )}

                {/* Flow to v2 */}
                <path d="M 145 105 L 255 135" stroke="rgba(52,211,153,0.3)" strokeWidth="2" fill="none" />
                {activeStep >= 1 ? (
                  <path d="M 145 105 L 255 135" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-green)" />
                ) : (
                  <path d="M 145 105 L 255 135" stroke="rgba(52,211,153,0.2)" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                )}

                {/* v1 Instance Box */}
                <rect x="260" y="15" width="160" height="60" rx="8" fill={activeStep >= 3 ? "rgba(255,255,255,0.02)" : "rgba(248,113,113,0.12)"} stroke={activeStep >= 3 ? "rgba(255,255,255,0.1)" : "#f87171"} strokeWidth="1.5" />
                <text x="340" y="40" textAnchor="middle" fill={activeStep >= 3 ? "var(--ifm-color-content-secondary)" : "#f87171"} fontSize="11" fontWeight="700">
                  {activeStep >= 3 ? 'v1 (Scaled to 0)' : 'v1 (order-service-v1)'}
                </text>
                <text x="340" y="58" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                  {activeStep >= 3 ? 'Decommissioned' : 'Serving Live Traffic'}
                </text>

                {/* v2 Instance Box */}
                <rect x="260" y="105" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="340" y="130" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">v2 (order-service-v2)</text>
                <text x="340" y="148" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                  {activeStep === 0 ? 'Not deployed yet' : activeStep === 1 ? 'Rebuilding RocksDB State' : activeStep === 2 ? 'Lag = 0 (Ready)' : 'Active Primary Engine'}
                </text>

                {/* Output topic arrows */}
                <path d="M 420 45 L 530 75" stroke={activeStep < 3 ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.05)"} strokeWidth="2" fill="none" />
                {activeStep < 3 && (
                  <path d="M 420 45 L 530 75" stroke="#f87171" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-red)" />
                )}

                <path d="M 420 135 L 530 105" stroke={activeStep >= 3 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.05)"} strokeWidth="2" fill="none" />
                {activeStep >= 3 && (
                  <path d="M 420 135 L 530 105" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-green)" />
                )}

                {/* Downstream Consumers */}
                <rect x="535" y="60" width="120" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="595" y="86" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Downstream</text>
                <text x="595" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">
                  {activeStep >= 3 ? 'Consuming v2' : 'Consuming v1'}
                </text>
              </g>
            )}

            {strategy === 'cold_reset' && (
              <g>
                <rect x="30" y="60" width="130" height="60" rx="8" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="95" y="86" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">1. Cluster State</text>
                <text x="95" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Scale replicas=0</text>

                <path d="M 160 90 L 250 90" stroke="rgba(251,191,36,0.3)" strokeWidth="2" fill="none" />
                <path d="M 160 90 L 250 90" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-amber)" />

                <rect x="255" y="60" width="160" height="60" rx="8" fill="rgba(249,115,22,0.12)" stroke="#f97316" strokeWidth="1.5" />
                <text x="335" y="86" textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="700">2. Reset & Wipe</text>
                <text x="335" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Purge PVC & Changelog</text>

                <path d="M 415 90 L 505 90" stroke="rgba(52,211,153,0.3)" strokeWidth="2" fill="none" />
                <path d="M 415 90 L 505 90" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-green)" />

                <rect x="510" y="60" width="140" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="580" y="86" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">3. Bootstrap v2</text>
                <text x="580" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Clean sub-topologies</text>
              </g>
            )}

            {strategy === 'decouple' && (
              <g>
                <rect x="30" y="60" width="120" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="90" y="86" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Orders Input</text>
                <text x="90" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Partition 0..N</text>

                <path d="M 150 75 L 245 45" stroke="rgba(56,189,248,0.3)" strokeWidth="2" fill="none" />
                <path d="M 150 75 L 245 45" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-blue)" />

                <rect x="250" y="15" width="180" height="60" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="340" y="40" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Order Service (App ID: A)</text>
                <text x="340" y="58" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Sub-topology 0 isolated</text>

                <path d="M 150 105 L 245 135" stroke="rgba(167,139,250,0.3)" strokeWidth="2" fill="none" />
                <path d="M 150 105 L 245 135" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-purple)" />

                <rect x="250" y="105" width="180" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="340" y="130" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Payment Service (App ID: B)</text>
                <text x="340" y="148" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Sub-topology 0 isolated</text>

                <rect x="490" y="60" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="570" y="86" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Zero Cross-Rebalances</text>
                <text x="570" y="103" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Independent lifecycles</text>
              </g>
            )}

            {strategy === 'append_only' && (
              <g>
                <rect x="40" y="60" width="120" height="60" rx="8" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="100" y="85" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Slot 0: Dummy Stub</text>
                <text x="100" y="102" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">filter(false) no-op</text>

                <path d="M 160 90 L 245 90" stroke="rgba(52,211,153,0.3)" strokeWidth="2" fill="none" />
                <path d="M 160 90 L 245 90" stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-green)" />

                <rect x="250" y="60" width="160" height="60" rx="8" fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="330" y="85" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Slot 1: Active Topology</text>
                <text x="330" y="102" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Task 1_0 remains intact</text>

                <path d="M 410 90 L 495 90" stroke="rgba(167,139,250,0.3)" strokeWidth="2" fill="none" />
                <path d="M 410 90 L 495 90" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" fill="none" markerEnd="url(#runbook-arr-purple)" />

                <rect x="500" y="60" width="150" height="60" rx="8" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="575" y="85" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Slot 2: New Sub-top</text>
                <text x="575" y="102" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Appended at tail</text>
              </g>
            )}
          </svg>
        </div>

        {/* Split Runbook Grid */}
        <div className="kstreams-runbook-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', alignItems: 'start' }}>
          {/* Left Step Navigator */}
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: curr.badgeColor, textTransform: 'uppercase' }}>
                EXECUTION RUNBOOK STEPS
              </span>
              <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${curr.badgeColor}22`, color: curr.badgeColor }}>
                {curr.badge}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {curr.steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: activeStep === idx ? `${curr.badgeColor}18` : 'rgba(255,255,255,0.02)',
                    border: activeStep === idx ? `1px solid ${curr.badgeColor}` : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: activeStep === idx ? curr.badgeColor : 'var(--ifm-color-content)' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                    {step.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Inspection & CLI Code Panel */}
          <div className="interactive-diagram-details-card details-green" style={{ minHeight: '320px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: curr.badgeColor, textTransform: 'uppercase', marginBottom: '4px' }}>
              STEP {activeStep + 1} DEEP DIVE
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
              {curr.steps[activeStep].title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
              {curr.steps[activeStep].detail}
            </p>

            {(curr.steps[activeStep] as any).cmd ? (
              <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '10px', marginTop: '8px' }}>
                <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
                  TERMINAL COMMAND
                </div>
                <code style={{ fontSize: '11px', color: '#38bdf8', wordBreak: 'break-all', display: 'block', background: 'transparent' }}>
                  {(curr.steps[activeStep] as any).cmd}
                </code>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', marginTop: '8px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: curr.badgeColor, marginBottom: '4px' }}>
                  ARCHITECTURAL BENEFIT:
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {strategy === 'blue_green' && 'Guarantees zero dropped records and zero downtime. If any issue occurs in v2, traffic can be instantly rolled back to v1.'}
                  {strategy === 'decouple' && 'Completely isolates the rebalance domain. Orders pipeline failures or state rebuilds never affect payment processing.'}
                  {strategy === 'append_only' && 'Ensures task ID stability across rolling updates by holding sub-topology array indices unchanged in StreamsBuilder.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
