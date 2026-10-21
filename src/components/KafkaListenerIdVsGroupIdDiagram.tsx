import React, { useState } from 'react';

type ConfigScenario = 'id-only' | 'group-only' | 'both' | 'id-is-group-false' | 'dynamic-spel';

interface ScenarioInfo {
  id: ConfigScenario;
  title: string;
  annotation: string;
  containerId: string;
  effectiveGroupId: string;
  springScope: string;
  kafkaScope: string;
  gotchaRisk: string;
  description: string;
}

const SCENARIOS: Record<ConfigScenario, ScenarioInfo> = {
  'id-only': {
    id: 'id-only',
    title: 'Only id Provided',
    annotation: '@KafkaListener(id = "orderProcessor", topics = "orders")',
    containerId: '"orderProcessor" (explicit)',
    effectiveGroupId: '"orderProcessor" (AUTO-COPIED!)',
    springScope: 'Registered in KafkaListenerEndpointRegistry with bean id "orderProcessor".',
    kafkaScope: 'Joins group "orderProcessor" in Kafka broker. Overrides global spring.kafka.consumer.group-id!',
    gotchaRisk: 'HIGH RISK: idIsGroup defaults to true! If you intended to inherit group-id="billing-service" from application.yml, it gets silently overridden by "orderProcessor", resetting partition offsets.',
    description: 'When groupId is omitted, Spring Kafka assumes idIsGroup = true. It sets the Kafka consumer group.id to the listener id value.'
  },
  'group-only': {
    id: 'group-only',
    title: 'Only groupId Provided',
    annotation: '@KafkaListener(groupId = "order-group", topics = "orders")',
    containerId: 'org.springframework.kafka...#0 (auto-generated anonymous ID)',
    effectiveGroupId: '"order-group" (explicit)',
    springScope: 'Registered with an auto-generated alphanumeric synthetic ID. Difficult to pause/resume programmatically.',
    kafkaScope: 'Joins group "order-group" in Kafka. Shares partitions with other consumers in the same group.',
    gotchaRisk: 'Cannot easily reference this listener container in KafkaListenerEndpointRegistry to call .pause() or .stop().',
    description: 'The Kafka consumer group is clearly defined, but Spring assigns a generated synthetic container ID, making lifecycle inspection awkward.'
  },
  'both': {
    id: 'both',
    title: 'Both id and groupId Provided (Best Practice)',
    annotation: '@KafkaListener(id = "orderContainer", groupId = "order-group", topics = "orders")',
    containerId: '"orderContainer" (clean, predictable)',
    effectiveGroupId: '"order-group" (isolated business group)',
    springScope: 'Easily controlled via registry.getListenerContainer("orderContainer"). Pause, resume, and health metrics are explicit.',
    kafkaScope: 'Coordinates partitions under group "order-group" across all cluster pods/instances.',
    gotchaRisk: 'Zero ambiguity. Container management and broker consumer group coordination are decoupled and cleanly named.',
    description: 'Production Gold Standard. Completely separates JVM container management (Spring) from distributed consumer group coordination (Kafka).'
  },
  'id-is-group-false': {
    id: 'id-is-group-false',
    title: 'id with idIsGroup = false',
    annotation: '@KafkaListener(id = "orderContainer", idIsGroup = false, topics = "orders")',
    containerId: '"orderContainer"',
    effectiveGroupId: 'Falls back to spring.kafka.consumer.group-id in application.yml',
    springScope: 'Registry uses "orderContainer" for lifecycle and thread naming (orderContainer-0-C-1).',
    kafkaScope: 'Uses global group.id from Spring Boot properties (e.g. "orders-app-v1").',
    gotchaRisk: 'If application.yml does not define spring.kafka.consumer.group-id, application startup fails with an exception.',
    description: 'Allows naming the container for Spring management while letting the consumer group be centrally governed by environment configuration.'
  },
  'dynamic-spel': {
    id: 'dynamic-spel',
    title: 'Dynamic SpEL Broadcast (Fan-Out Pub-Sub)',
    annotation: '@KafkaListener(id = "cacheInvalidator", groupId = "#{T(java.util.UUID).randomUUID().toString()}", topics = "config-updates")',
    containerId: '"cacheInvalidator"',
    effectiveGroupId: 'Random UUID per instance (e.g. "a3b9-41e8-...")',
    springScope: 'Uniform container ID on every instance for local metrics and graceful shutdown.',
    kafkaScope: 'Every running application instance gets a unique consumer group, receiving 100% of messages (full broadcast fan-out).',
    gotchaRisk: 'Must set auto.offset.reset = "latest" to avoid new instances reprocessing the entire topic history on restart.',
    description: 'Ideal for distributed cache eviction, local configuration reload, or WebSocket push where EVERY node must receive every event.'
  }
};

export default function KafkaListenerIdVsGroupIdDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'architecture' | 'scenarios' | 'lifecycle'>('architecture');
  const [scenarioKey, setScenarioKey] = useState<ConfigScenario>('both');

  const curScenario = SCENARIOS[scenarioKey];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kig-split-grid { grid-template-columns: 1fr !important; }
          .kig-nav-row { flex-direction: column !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.02em' }}>
          Spring Kafka: @KafkaListener `id` vs `groupId` Architecture
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          fontWeight: 700,
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          Engine Truth
        </span>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#090b14',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'architecture', label: '1. Architecture & Boundaries (Spring vs Kafka)', color: '#38bdf8' },
          { id: 'scenarios', label: '2. Configuration Scenarios Explorer', color: '#34d399' },
          { id: 'lifecycle', label: '3. Programmatic Pause/Resume (Registry)', color: '#fbbf24' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === tab.id ? `1.5px solid ${tab.color}` : '1px solid #334155',
              background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tab.color }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', background: '#0b0f19' }}>
        
        {/* TAB 1: ARCHITECTURE & BOUNDARIES */}
        {activeTab === 'architecture' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#38bdf8', fontWeight: 800 }}>
                Two Distinct Realms: Spring JVM Lifecycle vs. Kafka Broker Coordination
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                The fundamental confusion arises because both identify consumers, but they operate across entirely different physical boundaries.
              </p>
            </div>

            {/* Visual SVG Comparison */}
            <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px', marginBottom: '16px' }}>
              <svg viewBox="0 0 760 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="kig-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="kig-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
                  </marker>
                </defs>

                {/* Left Side: Spring Context Realm */}
                <rect x="15" y="15" width="345" height="200" rx="10" fill="#090b14" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="25" y="25" width="325" height="28" rx="6" fill="#1e293b" />
                <text x="187" y="44" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">
                  SPRING JVM REALM: listener `id`
                </text>

                <rect x="35" y="65" width="305" height="42" rx="6" fill="#0f172a" stroke="#334155" />
                <text x="187" y="83" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">KafkaListenerEndpointRegistry</text>
                <text x="187" y="97" fill="#94a3b8" fontSize="9.5" textAnchor="middle">registry.getListenerContainer("orderContainer")</text>

                <rect x="35" y="115" width="305" height="40" rx="6" fill="#0f172a" stroke="#334155" />
                <text x="187" y="132" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">MessageListenerContainer Bean</text>
                <text x="187" y="146" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Thread naming: orderContainer-0-C-1</text>

                <rect x="35" y="163" width="305" height="42" rx="6" fill="#1e1b4b" stroke="#6366f1" />
                <text x="187" y="180" fill="#c7d2fe" fontSize="10.5" fontWeight="700" textAnchor="middle">Lifecycle &amp; Operations</text>
                <text x="187" y="195" fill="#a5b4fc" fontSize="9" textAnchor="middle">pause(), resume(), stop(), start(), Actuator health metrics</text>

                {/* Right Side: Kafka Broker Realm */}
                <rect x="400" y="15" width="345" height="200" rx="10" fill="#090b14" stroke="#34d399" strokeWidth="1.5" />
                <rect x="410" y="25" width="325" height="28" rx="6" fill="#1e293b" />
                <text x="572" y="44" fill="#34d399" fontSize="12" fontWeight="800" textAnchor="middle">
                  KAFKA CLUSTER REALM: `groupId`
                </text>

                <rect x="420" y="65" width="305" height="42" rx="6" fill="#0f172a" stroke="#334155" />
                <text x="572" y="83" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Broker Group Coordinator</text>
                <text x="572" y="97" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Elected broker managing group membership</text>

                <rect x="420" y="115" width="305" height="40" rx="6" fill="#0f172a" stroke="#334155" />
                <text x="572" y="132" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Partition Assignment &amp; Rebalance</text>
                <text x="572" y="146" fill="#94a3b8" fontSize="9.5" textAnchor="middle">CooperativeStickyAssignor balance among members</text>

                <rect x="420" y="163" width="305" height="42" rx="6" fill="#064e3b" stroke="#059669" />
                <text x="572" y="180" fill="#a7f3d0" fontSize="10.5" fontWeight="700" textAnchor="middle">Offset Tracking &amp; Lag</text>
                <text x="572" y="195" fill="#6ee7b7" fontSize="9" textAnchor="middle">Offsets stored in __consumer_offsets topic per group</text>

                {/* Linking Bridge */}
                <path d="M 360 85 L 400 85" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" />
                <text x="380" y="78" fill="#fbbf24" fontSize="9" fontWeight="800" textAnchor="middle">idIsGroup</text>
              </svg>
            </div>

            {/* Split Comparison Cards */}
            <div className="kig-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }}>
              <div style={{ background: '#0c0e17', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                  The `id` Attribute (Spring ApplicationContext)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li><strong>Scope:</strong> JVM-local to your Spring Boot process.</li>
                  <li><strong>Uniqueness:</strong> MUST be unique within the Spring Context. Duplicate IDs throw <code>IllegalStateException</code> on startup.</li>
                  <li><strong>Control:</strong> Used by <code>KafkaListenerEndpointRegistry</code> to find and programmatically pause, resume, start, or stop the listener container.</li>
                  <li><strong>Observability:</strong> Names the consumer polling threads: <code>{`<id>-<index>-C-1`}</code>.</li>
                </ul>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                  The `groupId` Attribute (Apache Kafka Cluster)
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li><strong>Scope:</strong> Distributed across ALL servers, pods, and clusters reading the topic.</li>
                  <li><strong>Sharing:</strong> Multiple methods or pods sharing the same <code>groupId</code> act as competing consumers, load-balancing partitions.</li>
                  <li><strong>Offset Storage:</strong> Offsets are committed to Kafka&apos;s internal <code>__consumer_offsets</code> keyed by <code>(groupId, topic, partition)</code>.</li>
                  <li><strong>Rebalance:</strong> Adding/removing pods with this <code>groupId</code> triggers group rebalances.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONFIGURATION SCENARIOS EXPLORER */}
        {activeTab === 'scenarios' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#34d399', fontWeight: 800 }}>
                Interactive Configuration Scenario Explorer
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Select a configuration pattern below to understand how Spring Kafka interprets <code>id</code> and <code>groupId</code> under the hood.
              </p>
            </div>

            {/* Scenario Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {(Object.keys(SCENARIOS) as ConfigScenario[]).map(key => {
                const s = SCENARIOS[key];
                const isSelected = scenarioKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setScenarioKey(key)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid #334155',
                      background: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {s.title}
                  </button>
                );
              })}
            </div>

            {/* Active Scenario Card */}
            <div style={{ background: '#0d0f1e', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                  {curScenario.title}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  background: '#090b14',
                  color: '#fbbf24',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155'
                }}>
                  {curScenario.annotation}
                </span>
              </div>

              {/* Grid breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div style={{ background: '#0c0e17', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Container ID (Spring Registry)</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{curScenario.containerId}</div>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '6px' }}>{curScenario.springScope}</div>
                </div>

                <div style={{ background: '#0c0e17', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Effective Kafka group.id</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>{curScenario.effectiveGroupId}</div>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '6px' }}>{curScenario.kafkaScope}</div>
                </div>
              </div>

              {/* Gotcha Warning Box */}
              <div style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                color: '#fef08a',
                lineHeight: '1.5'
              }}>
                <strong>Production Gotcha / Architectural Rule:</strong> {curScenario.gotchaRisk}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROGRAMMATIC PAUSE/RESUME */}
        {activeTab === 'lifecycle' && (
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fbbf24', fontWeight: 800 }}>
                Programmatic Container Lifecycle with KafkaListenerEndpointRegistry
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Why setting an explicit <code>id</code> is mandatory for production systems: circuit breaking, throttling, and maintenance windows.
              </p>
            </div>

            <div style={{ background: '#0d0f1e', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>
                Under the Hood: What happens when you call container.pause()?
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.55' }}>
                When you call <code>registry.getListenerContainer("orderContainer").pause()</code>:
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>The container thread continues calling <code>consumer.poll(0)</code> to send heartbeats and keep the consumer alive in the broker group.</li>
                  <li>Kafka consumer internally pauses partition fetching (via <code>consumer.pause(partitions)</code>). No new records are fetched.</li>
                  <li><strong>Zero Rebalance:</strong> Because heartbeats continue, the consumer does NOT drop out of the group. No stop-the-world rebalance occurs!</li>
                  <li>When downstream recovers, calling <code>resume()</code> restores polling immediately.</li>
                </ul>
              </div>
            </div>

            <div style={{ background: '#090b14', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Production Spring Service Implementation</div>
              <pre style={{ margin: 0, background: 'transparent', color: '#e2e8f0', fontSize: '11.5px', fontFamily: 'monospace', overflowX: 'auto' }}>
{`@Service
public class KafkaConsumerLifecycleService {

    private final KafkaListenerEndpointRegistry registry;

    public KafkaConsumerLifecycleService(KafkaListenerEndpointRegistry registry) {
        this.registry = registry;
    }

    public void pauseConsumer(String listenerId) {
        MessageListenerContainer container = registry.getListenerContainer(listenerId);
        if (container != null && container.isRunning()) {
            container.pause();
            log.warn("Paused listener container: {}", listenerId);
        }
    }

    public void resumeConsumer(String listenerId) {
        MessageListenerContainer container = registry.getListenerContainer(listenerId);
        if (container != null && container.isContainerPaused()) {
            container.resume();
            log.info("Resumed listener container: {}", listenerId);
        }
    }
}`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
