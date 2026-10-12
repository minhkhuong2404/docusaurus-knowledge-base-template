import React, { useState } from 'react';

type CoverageDimension = 'http' | 'kafka' | 'streams' | 'jacoco';

interface ScenarioItem {
  id: string;
  title: string;
  type: string;
  color: string;
  description: string;
  assertion: string;
}

const KAFKA_SCENARIOS: ScenarioItem[] = [
  {
    id: 'schema',
    title: 'Schema Evolution Compatibility',
    type: 'Schema Registry',
    color: '#38bdf8',
    description: 'Verify producer sends Avro/Protobuf payload matching registered schema version; assert consumer handles backwards-compatible schema evolutions.',
    assertion: 'Assert schema ID matches Confluent Schema Registry; consumer deserializes without exception.',
  },
  {
    id: 'dlq',
    title: 'Poison Pill Payload to DLQ',
    type: 'Resilience',
    color: '#f87171',
    description: 'Send malformed JSON / unparsable event byte sequence. Consumer error handler must intercept failure and redirect record to Dead Letter Queue.',
    assertion: 'Verify consumer offset commits; malformed event lands in orders-dlq topic; consumer thread does not crash.',
  },
  {
    id: 'dedupe',
    title: 'Idempotent Deduplication',
    type: 'Data Integrity',
    color: '#34d399',
    description: 'Produce duplicate message with identical eventId / idempotency key. Service must process first event and safely ignore subsequent duplicates.',
    assertion: 'Assert database contains exactly 1 record; downstream Kafka event emitted exactly once.',
  },
  {
    id: 'tracing',
    title: 'Distributed Tracing Header Propagation',
    type: 'Observability',
    color: '#fbbf24',
    description: 'Verify traceparent and Baggage headers are injected into Kafka Record Headers and propagated across asynchronous service hops.',
    assertion: 'Assert OpenTelemetry SpanContext contains identical traceId across HTTP client, Kafka consumer, and DB log.',
  },
  {
    id: 'retry',
    title: 'Non-Blocking Retry Backoff Flow',
    type: 'Fault Tolerance',
    color: '#a78bfa',
    description: 'Transient database lock failure routes event to orders-retry-10s -> orders-retry-60s with exponential backoff before sending to DLQ.',
    assertion: 'Assert message republished to retry topic with header retry_count=1; delayed processing succeeds on retry.',
  },
];

interface DistributedTestingCoverageDiagramProps {
  initialDimension?: CoverageDimension;
}

export default function DistributedTestingCoverageDiagram({
  initialDimension = 'http',
}: DistributedTestingCoverageDiagramProps): React.JSX.Element {
  const [activeDimension, setActiveDimension] = useState<CoverageDimension>(initialDimension);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioItem>(KAFKA_SCENARIOS[1]);
  const [isDumpingJaCoCo, setIsDumpingJaCoCo] = useState<boolean>(false);
  const [dumpStatus, setDumpStatus] = useState<string>('Ready to trigger remote execution data dump');

  const triggerJaCoCoDump = (): void => {
    setIsDumpingJaCoCo(true);
    setDumpStatus('Connecting to remote TCP port 6300 on container JVM...');
    setTimeout(() => {
      setDumpStatus('Connected! Streaming bytecode execution session probes to jacoco-it.exec...');
    }, 800);
    setTimeout(() => {
      setDumpStatus('Execution data stream received! Merging jacoco-ut.exec + jacoco-it.exec -> jacoco-unified.exec (94.2% total line coverage)');
      setIsDumpingJaCoCo(false);
    }, 2200);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .coverage-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Distributed Microservices Test Coverage Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'http', label: '1. HTTP & OpenAPI Spec', color: '#38bdf8' },
            { id: 'kafka', label: '2. Kafka Event Matrix', color: '#34d399' },
            { id: 'streams', label: '3. Streams Topology DAG', color: '#fbbf24' },
            { id: 'jacoco', label: '4. Remote JaCoCo Agent', color: '#a78bfa' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDimension(tab.id as CoverageDimension)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeDimension === tab.id ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeDimension === tab.id ? `${tab.color}22` : 'transparent',
                color: activeDimension === tab.id ? tab.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas: Distributed Architecture Topology */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 260"
          className="interactive-diagram-svg"
          style={{ minHeight: '230px' }}
          role="img"
          aria-label="Distributed architecture test coverage flow diagram"
        >
          <defs>
            <marker
              id="dist-arrow-sky"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker
              id="dist-arrow-green"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
            <marker
              id="dist-arrow-amber"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="dist-arrow-purple"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
            </marker>
            <marker
              id="dist-arrow-red"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
          </defs>

          {/* Node 1: Black-Box Test Runner (Left) */}
          <g onClick={() => setActiveDimension('http')} style={{ cursor: 'pointer' }}>
            <rect
              x="20"
              y="55"
              width="150"
              height="150"
              rx="10"
              fill={activeDimension === 'http' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.7)'}
              stroke={activeDimension === 'http' ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}
              strokeWidth={activeDimension === 'http' ? 2 : 1}
            />
            <rect x="35" y="70" width="120" height="22" rx="4" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1" />
            <text x="95" y="85" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
              TEST RUNNER
            </text>
            <text x="95" y="115" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              RestAssured & CI
            </text>
            <text x="95" y="135" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              • OpenAPI / Pact Tests
            </text>
            <text x="95" y="152" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              • Kafka Event Probes
            </text>
            <text x="95" y="172" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              • JaCoCo TCP Client
            </text>
          </g>

          {/* Flow 1: HTTP API Calls to Service JVM */}
          <line x1="170" y1="95" x2="255" y2="95" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="170"
            y1="95"
            x2="255"
            y2="95"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#dist-arrow-sky)"
          />
          <text x="212" y="85" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">
            HTTP REST / Pact
          </text>

          {/* Node 2: Service Container JVM (Center-Top) */}
          <g onClick={() => setActiveDimension('jacoco')} style={{ cursor: 'pointer' }}>
            <rect
              x="260"
              y="30"
              width="210"
              height="100"
              rx="10"
              fill={activeDimension === 'jacoco' ? 'rgba(167, 139, 250, 0.18)' : 'rgba(15, 23, 42, 0.7)'}
              stroke={activeDimension === 'jacoco' ? '#a78bfa' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth={activeDimension === 'jacoco' ? 2 : 1}
            />
            <rect x="270" y="38" width="190" height="20" rx="4" fill="#a78bfa22" stroke="#a78bfa" strokeWidth="1" />
            <text x="365" y="52" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">
              RUNNING SERVICE (JVM CONTAINER)
            </text>
            <text x="365" y="80" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              Spring Boot Core Service
            </text>
            <text x="365" y="100" textAnchor="middle" fill="#86efac" fontSize="10" fontFamily="monospace">
              -javaagent:jacocoagent :6300
            </text>
            <text x="365" y="118" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">
              Bytecode probes in RAM memory
            </text>
          </g>

          {/* Flow 2: Service to Kafka Broker */}
          <path d="M 365 130 L 365 165" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <path
            d="M 365 130 L 365 165"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#dist-arrow-green)"
          />
          <text x="395" y="152" textAnchor="start" fill="#34d399" fontSize="9.5" fontWeight="600">
            Publish Event
          </text>

          {/* Node 3: Apache Kafka Broker & Topics (Center-Bottom) */}
          <g onClick={() => setActiveDimension('kafka')} style={{ cursor: 'pointer' }}>
            <rect
              x="260"
              y="170"
              width="210"
              height="80"
              rx="10"
              fill={activeDimension === 'kafka' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(15, 23, 42, 0.7)'}
              stroke={activeDimension === 'kafka' ? '#34d399' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth={activeDimension === 'kafka' ? 2 : 1}
            />
            <text x="365" y="193" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
              APACHE KAFKA CLUSTER
            </text>
            <text x="365" y="213" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11">
              topics: orders, payments
            </text>
            <text x="365" y="233" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="600">
              🚨 DLQ Topic: orders-dlq
            </text>
          </g>

          {/* Flow 3: Kafka to Kafka Streams App */}
          <line x1="470" y1="200" x2="525" y2="200" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="470"
            y1="200"
            x2="525"
            y2="200"
            stroke="#fbbf24"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#dist-arrow-amber)"
          />
          <text x="498" y="190" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="600">
            Stream Ingest
          </text>

          {/* Node 4: Kafka Streams Engine (Right-Top/Center) */}
          <g onClick={() => setActiveDimension('streams')} style={{ cursor: 'pointer' }}>
            <rect
              x="530"
              y="30"
              width="210"
              height="145"
              rx="10"
              fill={activeDimension === 'streams' ? 'rgba(251, 191, 36, 0.18)' : 'rgba(15, 23, 42, 0.7)'}
              stroke={activeDimension === 'streams' ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth={activeDimension === 'streams' ? 2 : 1}
            />
            <rect x="540" y="38" width="190" height="20" rx="4" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1" />
            <text x="635" y="52" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">
              KAFKA STREAMS TOPOLOGY
            </text>
            <text x="635" y="80" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              TopologyTestDriver (DAG)
            </text>
            <text x="635" y="102" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              • Branch & Filter Routing
            </text>
            <text x="635" y="120" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              • KStream-KTable Joins
            </text>
            <text x="635" y="138" textAnchor="middle" fill="#38bdf8" fontSize="10">
              • RocksDB State Store
            </text>
            <text x="635" y="158" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">
              • advanceWallClockTime()
            </text>
          </g>

          {/* Flow 4: Remote JaCoCo Dump TCP Stream Back to Runner */}
          <path
            d="M 470 65 C 500 65, 510 15, 365 15 C 220 15, 175 40, 160 65"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          <path
            d="M 470 65 C 500 65, 510 15, 365 15 C 220 15, 175 40, 160 65"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2.5"
            className={isDumpingJaCoCo ? 'interactive-diagram-flowing-path' : ''}
            strokeDasharray={isDumpingJaCoCo ? '6 4' : 'none'}
            markerEnd="url(#dist-arrow-purple)"
          />
          <text x="365" y="12" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="700">
            TCP Port 6300 JaCoCo Dump Stream (jacococli dump)
          </text>

          {/* Node 5: Unified Coverage Report Generator (Right-Bottom) */}
          <g onClick={() => setActiveDimension('jacoco')} style={{ cursor: 'pointer' }}>
            <rect
              x="760"
              y="55"
              width="160"
              height="150"
              rx="10"
              fill={activeDimension === 'jacoco' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(15, 23, 42, 0.7)'}
              stroke={activeDimension === 'jacoco' ? '#a78bfa' : 'rgba(255, 255, 255, 0.12)'}
              strokeWidth={activeDimension === 'jacoco' ? 2 : 1}
            />
            <rect x="770" y="70" width="140" height="22" rx="4" fill="#a78bfa22" stroke="#a78bfa" strokeWidth="1" />
            <text x="840" y="85" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="700">
              UNIFIED COVERAGE
            </text>
            <text x="840" y="115" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              jacoco-unified.exec
            </text>
            <text x="840" y="138" textAnchor="middle" fill="#38bdf8" fontSize="10.5">
              jacoco-ut.exec (Unit)
            </text>
            <text x="840" y="156" textAnchor="middle" fill="#a78bfa" fontSize="10.5">
              + jacoco-it.exec (E2E)
            </text>
            <text x="840" y="180" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
              = Complete Truth!
            </text>
          </g>
        </svg>
      </div>

      {/* Detail Panels by Dimension */}

      {/* Tab 1: HTTP API & Contract Coverage */}
      {activeDimension === 'http' && (
        <div className="coverage-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#38bdf822', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                DIMENSION 1: HTTP SPECIFICATION
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              OpenAPI / Swagger Contract Audit
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Standard unit test coverage reports lines of Java executed, but fails to verify whether your test suite exercised the complete public API contract.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: '#38bdf8' }}>Endpoint Coverage:</strong> Every path across all HTTP verbs (<code>GET</code>, <code>POST</code>, <code>PATCH</code>, <code>DELETE</code>) must be stimulated.
              </li>
              <li>
                <strong style={{ color: '#34d399' }}>Status Code Matrix:</strong> Assert both 2xx success contracts and 4xx/5xx error contracts (<code>400 Bad Request</code>, <code>401 Unauthorized</code>, <code>404 Not Found</code>, <code>409 Conflict</code>, <code>422 Unprocessable</code>).
              </li>
              <li>
                <strong style={{ color: '#fbbf24' }}>Parameter Permutations:</strong> Assert query filters, pagination boundaries (<code>page=0, size=50</code>), and header mutations (<code>Idempotency-Key</code>).
              </li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#34d39922', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                CONTRACT SAFETY
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Pact Consumer-Driven Contract Coverage
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              In microservices, service-to-service breaking changes occur when downstream providers violate consumer payload expectations.
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <strong style={{ fontSize: '12px', color: '#34d399', display: 'block', marginBottom: '4px' }}>
                🚀 How Pact Prevents Production Incidents:
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                Each consumer publishes a contract JSON (Pact file). In the provider CI pipeline, <code>@PactVerification</code> executes mock requests against provider controllers, failing the build if any field type or HTTP header mismatches.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kafka Event Matrix */}
      {activeDimension === 'kafka' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Dimension 2: Asynchronous Kafka Event & Scenario Matrix
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Asynchronous messaging introduces distributed failure states impossible in HTTP: schema mutation mismatches, duplicate deliveries, transient DB lock retries, and malformed poison pill events. Select a scenario to inspect testing assertions:
            </p>
          </div>

          {/* Scenario Selectors */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {KAFKA_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid ${selectedScenario.id === sc.id ? sc.color : 'rgba(255, 255, 255, 0.1)'}`,
                  background: selectedScenario.id === sc.id ? `${sc.color}22` : 'rgba(255, 255, 255, 0.02)',
                  color: selectedScenario.id === sc.id ? sc.color : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sc.title}
              </button>
            ))}
          </div>

          {/* Selected Scenario Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: `1px solid ${selectedScenario.color}55`,
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {selectedScenario.title}
              </span>
              <span style={{ background: `${selectedScenario.color}22`, color: selectedScenario.color, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {selectedScenario.type}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {selectedScenario.description}
            </p>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '8px 12px', borderRadius: '6px', borderLeft: `3px solid ${selectedScenario.color}` }}>
              <strong style={{ fontSize: '11.5px', color: selectedScenario.color }}>Required Test Assertion:</strong>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                {selectedScenario.assertion}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Kafka Streams Topology DAG */}
      {activeDimension === 'streams' && (
        <div className="coverage-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#fbbf2422', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                DIMENSION 3: STREAMS DAG
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              TopologyTestDriver (In-Memory Microsecond Testing)
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Spinning up multi-broker Kafka clusters for every stream processor permutation is too slow for fast CI/CD. <strong><code>TopologyTestDriver</code></strong> executes the entire processor DAG in-memory without a real broker.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: '#fbbf24' }}>Branch & Split Coverage:</strong> Assert test records exercise both true and false paths across <code>.branch()</code> and <code>.filter()</code>.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Stream-Table Joins:</strong> Verify record behavior when key is present vs missing in KTable (null-safe handling).
              </li>
              <li>
                <strong style={{ color: '#34d399' }}>RocksDB State Restoration:</strong> Assert standby task or reboot restores properly from the changelog topic without state loss.
              </li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#38bdf822', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                TIME-BASED WINDOWING
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Deterministic Wall-Clock Simulation
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Testing tumbling windows, session timeouts, and periodic aggregations without sleeping in tests:
            </p>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', fontSize: '11px', background: '#080a12', color: '#86efac', overflowX: 'auto', lineHeight: 1.35 }}>
              <code>{`// Advance simulated wall clock by 5 minutes
testDriver.advanceWallClockTime(Duration.ofMinutes(5));

// Verify that periodic punctuate() flushed aggregation
OutputRecord<String, AggregatedStats> record =
    outputTopic.readRecord();
assertThat(record.getValue().orderCount()).isEqualTo(42);`}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Remote JaCoCo Agent Dump Protocol */}
      {activeDimension === 'jacoco' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #a78bfa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0, color: 'var(--ifm-color-content)', fontSize: '15px' }}>
                Dimension 4: Multi-Process JaCoCo Remote Bytecode Dump (Port 6300)
              </h4>
              <button
                onClick={triggerJaCoCoDump}
                disabled={isDumpingJaCoCo}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: isDumpingJaCoCo ? 'rgba(167, 139, 250, 0.2)' : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                  color: isDumpingJaCoCo ? '#a78bfa' : '#ffffff',
                  border: 'none',
                  cursor: isDumpingJaCoCo ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(167, 139, 250, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isDumpingJaCoCo ? '⏳ Dumping JaCoCo TCP Execution Data...' : '⚡ Simulate JaCoCo TCP Dump'}
              </button>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              When black-box tests run in Process A (JUnit / RestAssured) and your microservice runs in Process B (Docker container), standard JaCoCo reports 0% coverage. Attaching <code>-javaagent:jacocoagent.jar=output=tcpserver,port=6300</code> collects live execution probes in memory, dumped over TCP at the end of the E2E test suite.
            </p>
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', fontSize: '12px', color: '#a78bfa' }}>
              <strong>Status Log:</strong> {dumpStatus}
            </div>
          </div>

          <div className="coverage-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
              <h5 style={{ margin: '0 0 6px 0', color: 'var(--ifm-color-content)', fontSize: '14px' }}>
                1. Container JVM Launch Flag
              </h5>
              <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', fontSize: '11px', background: '#080a12', color: '#86efac', overflowX: 'auto', lineHeight: 1.35 }}>
                <code>{`java -javaagent:/jacoco/jacocoagent.jar=\\
output=tcpserver,address=*,port=6300 \\
-jar application.jar`}</code>
              </pre>
            </div>

            <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
              <h5 style={{ margin: '0 0 6px 0', color: 'var(--ifm-color-content)', fontSize: '14px' }}>
                2. CI Pipeline Post-Test TCP Dump
              </h5>
              <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', fontSize: '11px', background: '#080a12', color: '#86efac', overflowX: 'auto', lineHeight: 1.35 }}>
                <code>{`java -jar jacococli.jar dump \\
  --address localhost \\
  --port 6300 \\
  --destfile target/jacoco-it.exec`}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
