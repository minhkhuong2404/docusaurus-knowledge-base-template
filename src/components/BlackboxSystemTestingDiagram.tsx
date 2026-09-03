import React, { useState } from 'react';

type TabMode = 'blackbox' | 'system' | 'bva' | 'stack';

interface TestCase {
  name: string;
  input: string;
  type: 'Valid' | 'Boundary Min' | 'Boundary Max' | 'Invalid Low' | 'Invalid High';
  expected: string;
  status: 'Pass' | 'Fail';
}

const SAMPLE_BVA_CASES: TestCase[] = [
  { name: 'Lower Outer Boundary', input: 'Age: 17', type: 'Invalid Low', expected: 'HTTP 422 Unprocessable (Age must be ≥ 18)', status: 'Pass' },
  { name: 'Lower Inclusive Bound', input: 'Age: 18', type: 'Boundary Min', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Lower Inner Bound', input: 'Age: 19', type: 'Valid', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Nominal Valid Case', input: 'Age: 35', type: 'Valid', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Upper Inner Bound', input: 'Age: 64', type: 'Valid', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Upper Inclusive Bound', input: 'Age: 65', type: 'Boundary Max', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Upper Outer Boundary', input: 'Age: 66', type: 'Invalid High', expected: 'HTTP 422 Unprocessable (Age must be ≤ 65)', status: 'Pass' },
];

export default function BlackboxSystemTestingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('blackbox');
  const [selectedFlowStep, setSelectedFlowStep] = useState<number>(1);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase>(SAMPLE_BVA_CASES[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .blackbox-grid-layout {
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Black-Box & System Testing Architecture Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'blackbox', label: '📦 Black-Box Concept', color: '#38bdf8' },
            { id: 'system', label: '🌐 System Testing Scope', color: '#34d399' },
            { id: 'bva', label: '🎯 EP & Boundary Analysis', color: '#fbbf24' },
            { id: 'stack', label: '🛠️ Modern Test Stack', color: '#a78bfa' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabMode)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 220"
          className="interactive-diagram-svg"
          style={{ minHeight: '200px' }}
          role="img"
          aria-label="Black-box and system testing request-response flow diagram"
        >
          <defs>
            <marker
              id="arrow-sky"
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
              id="arrow-green"
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
              id="arrow-amber"
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
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
            </marker>
            <linearGradient id="blackbox-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* External Tester Area (Left) */}
          <g
            onClick={() => setSelectedFlowStep(1)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="20"
              y="40"
              width="140"
              height="140"
              rx="10"
              fill={selectedFlowStep === 1 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)'}
              stroke={selectedFlowStep === 1 ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth={selectedFlowStep === 1 ? 2 : 1}
            />
            <circle cx="90" cy="80" r="22" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <path
              d="M 80 82 C 80 75, 100 75, 100 82 M 90 68 A 5 5 0 1 0 90 78 A 5 5 0 1 0 90 68"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.8"
            />
            <text x="90" y="125" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="13" fontWeight="700">
              External Tester
            </text>
            <text x="90" y="145" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5">
              Client / API Test
            </text>
            <text x="90" y="162" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">
              Step 1: Input Payload
            </text>
          </g>

          {/* Flow Line 1: Tester -> System Ingestion */}
          <line
            x1="160"
            y1="90"
            x2="235"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          <line
            x1="160"
            y1="90"
            x2="235"
            y2="90"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-sky)"
          />
          <text x="198" y="80" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
            HTTP / Event
          </text>

          {/* The Black Box Boundary (Center Container) */}
          <rect
            x="240"
            y="20"
            width="460"
            height="180"
            rx="14"
            fill="url(#blackbox-bg)"
            stroke="#34d399"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <rect
            x="250"
            y="28"
            width="170"
            height="20"
            rx="4"
            fill="#34d39922"
            stroke="#34d399"
            strokeWidth="1"
          />
          <text x="335" y="42" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">
            OPAQUE SYSTEM BOUNDARY
          </text>

          {/* Subsystem 1: API Gateway & Auth */}
          <g
            onClick={() => setSelectedFlowStep(2)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="260"
              y="65"
              width="100"
              height="100"
              rx="8"
              fill={selectedFlowStep === 2 ? 'rgba(52, 211, 153, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={selectedFlowStep === 2 ? '#34d399' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth={selectedFlowStep === 2 ? 2 : 1}
            />
            <text x="310" y="100" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              API Gateway
            </text>
            <text x="310" y="118" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              Auth & Routing
            </text>
            <text x="310" y="142" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="600">
              Step 2: Validation
            </text>
          </g>

          {/* Conduit: Gateway -> Internal Services */}
          <line
            x1="360"
            y1="115"
            x2="415"
            y2="115"
            stroke="#34d399"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          <line
            x1="360"
            y1="115"
            x2="415"
            y2="115"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green)"
          />

          {/* Subsystem 2: Domain Microservices */}
          <g
            onClick={() => setSelectedFlowStep(3)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="420"
              y="65"
              width="110"
              height="100"
              rx="8"
              fill={selectedFlowStep === 3 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={selectedFlowStep === 3 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth={selectedFlowStep === 3 ? 2 : 1}
            />
            <text x="475" y="100" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              Core Engine
            </text>
            <text x="475" y="118" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              Business Logic
            </text>
            <text x="475" y="142" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="600">
              Step 3: Workflow
            </text>
          </g>

          {/* Conduit: Core Engine -> Persistence / Queue */}
          <line
            x1="530"
            y1="115"
            x2="575"
            y2="115"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          <line
            x1="530"
            y1="115"
            x2="575"
            y2="115"
            stroke="#fbbf24"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-amber)"
          />

          {/* Subsystem 3: Persistence & Kafka */}
          <g
            onClick={() => setSelectedFlowStep(4)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="580"
              y="65"
              width="105"
              height="100"
              rx="8"
              fill={selectedFlowStep === 4 ? 'rgba(167, 139, 250, 0.2)' : 'rgba(30, 41, 59, 0.7)'}
              stroke={selectedFlowStep === 4 ? '#a78bfa' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth={selectedFlowStep === 4 ? 2 : 1}
            />
            <text x="632" y="100" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">
              DB & Queues
            </text>
            <text x="632" y="118" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              Postgres / Kafka
            </text>
            <text x="632" y="142" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="600">
              Step 4: Persistence
            </text>
          </g>

          {/* Flow Line: Output Back to Tester */}
          <path
            d="M 685 115 C 720 115, 730 145, 755 145"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          <path
            d="M 685 115 C 720 115, 730 145, 755 145"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-sky)"
          />
          <text x="715" y="125" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
            Outcomes
          </text>

          {/* External Verification Node (Right) */}
          <g
            onClick={() => setSelectedFlowStep(5)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x="760"
              y="40"
              width="155"
              height="140"
              rx="10"
              fill={selectedFlowStep === 5 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)'}
              stroke={selectedFlowStep === 5 ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth={selectedFlowStep === 5 ? 2 : 1}
            />
            <circle cx="837" cy="80" r="22" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <path
              d="M 827 80 L 834 87 L 848 73"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x="837" y="125" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="13" fontWeight="700">
              Contract Assertions
            </text>
            <text x="837" y="145" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5">
              Status, Headers & Data
            </text>
            <text x="837" y="162" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">
              Step 5: Black-Box Verdict
            </text>
          </g>
        </svg>
      </div>

      {/* Tab 1: Black-Box Testing Concept */}
      {activeTab === 'blackbox' && (
        <div className="blackbox-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#38bdf822', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                PHILOSOPHY & RATIONALE
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Why Black-Box Testing Exists (The Core Idea)
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Black-box testing treats the application as an <strong>opaque box</strong>. The test suite has zero knowledge of class names, internal methods, memory allocations, or database tables. It exercises the software solely through public interfaces (REST APIs, gRPC, message queues, UI).
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <strong style={{ fontSize: '12px', color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
                🌟 Primary Strategic Superpower: Refactoring Immunity
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                White-box unit tests break constantly when you refactor class structures, even if functionality remains identical. Black-box tests <em>never break during internal refactorings</em> because they verify business contracts, not code paths.
              </p>
            </div>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#34d39922', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                KEY CHARACTERISTICS
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Eliminating Confirmation Bias
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: 'var(--ifm-color-content)' }}>Tester vs Creator Mindset:</strong> Developers write tests for what they <em>built</em>; black-box testers write tests for what was <em>specified</em>.
              </li>
              <li>
                <strong style={{ color: 'var(--ifm-color-content)' }}>Finds Missing Logic:</strong> White-box tests only test paths that exist in code. Black-box tests identify requirements completely forgotten by the developer.
              </li>
              <li>
                <strong style={{ color: 'var(--ifm-color-content)' }}>Polyglot Compatibility:</strong> You can rewrite the backend from Java Spring to Go or Rust without modifying a single black-box test suite.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: System Testing Scope */}
      {activeTab === 'system' && (
        <div className="blackbox-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#34d39922', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                HOLISTIC INTEGRITY
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              The Core Idea of System Testing
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              In the V-Model, <strong>System Testing</strong> evaluates the complete, fully assembled application against the entire System Requirements Specification (SRS). All external dependencies (real databases, messaging clusters, caches, networks) operate in concert.
            </p>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <strong style={{ fontSize: '12px', color: '#34d399', display: 'block', marginBottom: '4px' }}>
                ⚠️ Why 100% Unit + Integration Tests Still Fail:
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                Microservices with passing unit tests crash in production due to: distributed deadlock, TCP keepalive mismatches, connection pool exhaustion under load, cascading retry storms, and eventual consistency lag.
              </p>
            </div>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#fbbf2422', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                NON-FUNCTIONAL DIMENSIONS
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Non-Functional Requirements (NFR) Validation
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: '#34d399' }}>Performance & Soak Testing:</strong> Running 10,000 req/sec over 48 hours to detect memory leaks and GC pause degradation.
              </li>
              <li>
                <strong style={{ color: '#f87171' }}>Resilience & Chaos:</strong> Terminating primary database nodes or killing Kubernetes pods to verify automatic failover and circuit breaking.
              </li>
              <li>
                <strong style={{ color: '#a78bfa' }}>Security & RBAC:</strong> Fuzzing input parameters, verifying OAuth2 token expiration, and auditing tenant isolation barriers.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Equivalence Partitioning & Boundary Value Analysis */}
      {activeTab === 'bva' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Specification Techniques: Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Testing every possible value is impossible. <strong>Equivalence Partitioning</strong> groups inputs into partitions where any value produces identical behavior. <strong>Boundary Value Analysis</strong> tests the exact transition edges, where 80% of boundary bugs cluster.
            </p>
          </div>

          {/* Interactive BVA Case Selector */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {SAMPLE_BVA_CASES.map((tc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTestCase(tc)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: `1px solid ${selectedTestCase.name === tc.name ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: selectedTestCase.name === tc.name ? '#fbbf2422' : 'rgba(255, 255, 255, 0.02)',
                  color: selectedTestCase.name === tc.name ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tc.input} ({tc.type})
              </button>
            ))}
          </div>

          {/* Selected Test Case Inspector */}
          <div
            style={{
              background: '#090b14',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                Test Case: {selectedTestCase.name}
              </span>
              <span style={{ background: '#34d39922', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {selectedTestCase.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Partition Category:</strong> <span style={{ color: '#fbbf24' }}>{selectedTestCase.type}</span> | <strong>Input Value:</strong> <code>{selectedTestCase.input}</code>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <strong>Expected Contract Output:</strong> <code style={{ color: '#34d399' }}>{selectedTestCase.expected}</code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Modern Black-Box Testing Stack */}
      {activeTab === 'stack' && (
        <div className="blackbox-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #a78bfa' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Modern Black-Box / System Test Tooling
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: '#38bdf8' }}>Testcontainers:</strong> Spins up real, disposable Docker instances of PostgreSQL, Kafka, and Redis. No in-memory H2 false positives!
              </li>
              <li>
                <strong style={{ color: '#34d399' }}>RestAssured / Playwright:</strong> Fluent HTTP domain assertions and headless browser execution against running systems.
              </li>
              <li>
                <strong style={{ color: '#fbbf24' }}>WireMock:</strong> Mocks third-party external dependencies (payment gateways, partner APIs) with deterministic fault injection.
              </li>
              <li>
                <strong style={{ color: '#a78bfa' }}>Pact (Contract Testing):</strong> Verifies provider-consumer API contracts asynchronously without spinning up all downstream microservices.
              </li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Black-Box RestAssured + Testcontainers Pattern
            </h4>
            <pre style={{ margin: 0, padding: '10px', borderRadius: '6px', fontSize: '11px', background: '#080a12', color: '#86efac', overflowX: 'auto', lineHeight: 1.35 }}>
              <code>{`@Testcontainers
@SpringBootTest(webEnvironment = RANDOM_PORT)
class AccountSystemE2ETest {

  @Container
  static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");

  @Test
  void testCreateAccount_ValidAge_ReturnsCreated() {
    given()
      .contentType(ContentType.JSON)
      .body(new CreateAccountRequest("Alice", 25))
    .when()
      .post("/api/v1/accounts")
    .then()
      .statusCode(201)
      .body("status", equalTo("ACTIVE"))
      .body("accountId", notNullValue());
  }
}`}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
