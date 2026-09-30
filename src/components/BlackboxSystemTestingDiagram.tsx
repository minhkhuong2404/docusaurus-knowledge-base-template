import React, { useState } from 'react';

type TabMode = 'blackbox' | 'bva' | 'vmodel' | 'system' | 'stack';

interface TestCase {
  name: string;
  input: string;
  value: number;
  type: 'Valid' | 'Boundary Min' | 'Boundary Max' | 'Invalid Low' | 'Invalid High';
  expected: string;
  status: 'Pass' | 'Fail';
}

const SAMPLE_BVA_CASES: TestCase[] = [
  { name: 'Lower Outer Boundary (A-1)', input: 'Age: 17', value: 17, type: 'Invalid Low', expected: 'HTTP 422 Unprocessable (Age must be ≥ 18)', status: 'Pass' },
  { name: 'Lower Inclusive Bound (A)', input: 'Age: 18', value: 18, type: 'Boundary Min', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Lower Inner Bound (A+1)', input: 'Age: 19', value: 19, type: 'Valid', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Nominal Valid Case (Midpoint)', input: 'Age: 35', value: 35, type: 'Valid', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Upper Inner Bound (B-1)', input: 'Age: 64', value: 64, type: 'Valid', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Upper Inclusive Bound (B)', input: 'Age: 65', value: 65, type: 'Boundary Max', expected: 'HTTP 200 OK (Account created successfully)', status: 'Pass' },
  { name: 'Upper Outer Boundary (B+1)', input: 'Age: 66', value: 66, type: 'Invalid High', expected: 'HTTP 422 Unprocessable (Age must be ≤ 65)', status: 'Pass' },
];

interface BlackboxSystemTestingDiagramProps {
  initialTab?: TabMode;
}

export default function BlackboxSystemTestingDiagram({
  initialTab = 'blackbox',
}: BlackboxSystemTestingDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);
  const [selectedFlowStep, setSelectedFlowStep] = useState<number>(1);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase>(SAMPLE_BVA_CASES[1]);
  const [selectedVModelLevel, setSelectedVModelLevel] = useState<'system' | 'unit' | 'integration' | 'uat'>('system');

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
            { id: 'blackbox', label: '1. Black-Box Concept', color: '#38bdf8' },
            { id: 'bva', label: '2. EP & Boundary Analysis', color: '#fbbf24' },
            { id: 'vmodel', label: '3. V-Model Hierarchy', color: '#2dd4bf' },
            { id: 'system', label: '4. System Testing Scope', color: '#34d399' },
            { id: 'stack', label: '5. Modern Test Stack', color: '#a78bfa' },
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

      {/* SVG Canvas for V-Model Hierarchy */}
      {activeTab === 'vmodel' && (
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg
            viewBox="0 0 940 310"
            className="interactive-diagram-svg"
            style={{ minHeight: '280px' }}
            role="img"
            aria-label="V-Model Testing Architecture and Verification Flow"
          >
            <defs>
              <marker id="vm-arrow-teal" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
              </marker>
              <marker id="vm-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="vm-arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="vm-arrow-sky" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="vm-arrow-down" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
              </marker>
              <marker id="vm-arrow-up" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
              </marker>
            </defs>

            {/* Left Column: Requirements & Design (Decomposition) */}
            <text x="140" y="22" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">
              REQUIREMENTS & SPECIFICATIONS
            </text>

            {/* Level 1 Left: Business Requirements */}
            <g onClick={() => setSelectedVModelLevel('uat')} style={{ cursor: 'pointer' }}>
              <rect x="30" y="35" width="220" height="42" rx="8" fill={selectedVModelLevel === 'uat' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)'} stroke="#38bdf8" strokeWidth={selectedVModelLevel === 'uat' ? 2 : 1} />
              <text x="140" y="55" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11.5" fontWeight="700">Business Requirements</text>
              <text x="140" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">User Goals & Market Needs</text>
            </g>

            {/* Down arrow 1 */}
            <line x1="140" y1="77" x2="140" y2="95" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vm-arrow-down)" />

            {/* Level 2 Left: System Requirements (SRS) */}
            <g onClick={() => setSelectedVModelLevel('system')} style={{ cursor: 'pointer' }}>
              <rect x="50" y="97" width="220" height="42" rx="8" fill={selectedVModelLevel === 'system' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(15, 23, 42, 0.7)'} stroke="#34d399" strokeWidth={selectedVModelLevel === 'system' ? 2.5 : 1} />
              <text x="160" y="117" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">System Requirements (SRS)</text>
              <text x="160" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Functional & NFR Contracts</text>
            </g>

            {/* Down arrow 2 */}
            <line x1="160" y1="139" x2="160" y2="157" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vm-arrow-down)" />

            {/* Level 3 Left: Architecture & Component Design */}
            <g onClick={() => setSelectedVModelLevel('integration')} style={{ cursor: 'pointer' }}>
              <rect x="70" y="159" width="220" height="42" rx="8" fill={selectedVModelLevel === 'integration' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(15, 23, 42, 0.7)'} stroke="#fbbf24" strokeWidth={selectedVModelLevel === 'integration' ? 2 : 1} />
              <text x="180" y="179" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11.5" fontWeight="700">Architecture & Interfaces</text>
              <text x="180" y="194" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Microservices, DB, Kafka Contracts</text>
            </g>

            {/* Down arrow 3 */}
            <line x1="180" y1="201" x2="180" y2="219" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vm-arrow-down)" />

            {/* Level 4 Left: Detailed Class Logic */}
            <g onClick={() => setSelectedVModelLevel('unit')} style={{ cursor: 'pointer' }}>
              <rect x="90" y="221" width="220" height="42" rx="8" fill={selectedVModelLevel === 'unit' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(15, 23, 42, 0.7)'} stroke="#2dd4bf" strokeWidth={selectedVModelLevel === 'unit' ? 2 : 1} />
              <text x="200" y="241" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11.5" fontWeight="700">Detailed Class Logic</text>
              <text x="200" y="256" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Methods, Branching & Algorithms</text>
            </g>

            {/* Bottom Apex: Implementation */}
            <path d="M 200 263 L 200 285 L 470 285 L 740 285 L 740 263" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 3" />
            <rect x="370" y="268" width="200" height="34" rx="8" fill="#a78bfa22" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="470" y="289" textAnchor="middle" fill="#a78bfa" fontSize="11.5" fontWeight="700">
              💻 Coding & Build Execution
            </text>

            {/* Right Column: Testing Levels (Validation) */}
            <text x="800" y="22" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">
              TESTING & VALIDATION LEVELS
            </text>

            {/* Level 4 Right: Unit Testing */}
            <g onClick={() => setSelectedVModelLevel('unit')} style={{ cursor: 'pointer' }}>
              <rect x="630" y="221" width="220" height="42" rx="8" fill={selectedVModelLevel === 'unit' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(15, 23, 42, 0.7)'} stroke="#2dd4bf" strokeWidth={selectedVModelLevel === 'unit' ? 2 : 1} />
              <text x="740" y="241" textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="700">Unit Testing</text>
              <text x="740" y="256" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">JUnit / Mockito (~ms)</text>
            </g>

            {/* Up arrow 1 */}
            <line x1="760" y1="221" x2="760" y2="203" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vm-arrow-up)" />

            {/* Level 3 Right: Integration Testing */}
            <g onClick={() => setSelectedVModelLevel('integration')} style={{ cursor: 'pointer' }}>
              <rect x="650" y="159" width="220" height="42" rx="8" fill={selectedVModelLevel === 'integration' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(15, 23, 42, 0.7)'} stroke="#fbbf24" strokeWidth={selectedVModelLevel === 'integration' ? 2 : 1} />
              <text x="760" y="179" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700">Integration Testing</text>
              <text x="760" y="194" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">WireMock / Sliced Contexts</text>
            </g>

            {/* Up arrow 2 */}
            <line x1="780" y1="159" x2="780" y2="141" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vm-arrow-up)" />

            {/* Level 2 Right: System Testing (Highlighted!) */}
            <g onClick={() => setSelectedVModelLevel('system')} style={{ cursor: 'pointer' }}>
              <rect x="670" y="97" width="240" height="42" rx="8" fill={selectedVModelLevel === 'system' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(15, 23, 42, 0.7)'} stroke="#34d399" strokeWidth={selectedVModelLevel === 'system' ? 2.5 : 1} />
              <text x="790" y="117" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="800">SYSTEM TESTING ⭐</text>
              <text x="790" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">E2E + NFR (Testcontainers)</text>
            </g>

            {/* Up arrow 3 */}
            <line x1="800" y1="97" x2="800" y2="79" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#vm-arrow-up)" />

            {/* Level 1 Right: User Acceptance Testing (UAT) */}
            <g onClick={() => setSelectedVModelLevel('uat')} style={{ cursor: 'pointer' }}>
              <rect x="690" y="35" width="220" height="42" rx="8" fill={selectedVModelLevel === 'uat' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)'} stroke="#38bdf8" strokeWidth={selectedVModelLevel === 'uat' ? 2 : 1} />
              <text x="800" y="55" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Acceptance Testing (UAT)</text>
              <text x="800" y="70" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Business User Sign-Off</text>
            </g>

            {/* HORIZONTAL VALIDATION CONDUITS */}
            {/* Level 1 Horizontal: UAT <-> Business */}
            <line x1="690" y1="56" x2="255" y2="56" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />

            {/* Level 2 Horizontal: SYSTEM TESTING <-> SRS (PRIMARY HIGHLIGHT) */}
            <line x1="670" y1="118" x2="275" y2="118" stroke="#34d399" strokeWidth="2.5" strokeOpacity="0.3" />
            <line x1="670" y1="118" x2="275" y2="118" stroke="#34d399" strokeWidth="3" className="interactive-diagram-flowing-path" markerEnd="url(#vm-arrow-green)" />
            <rect x="420" y="105" width="120" height="24" rx="4" fill="#0f172a" stroke="#34d399" strokeWidth="1" />
            <text x="480" y="121" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">
              Validates SRS
            </text>

            {/* Level 3 Horizontal: Integration <-> Architecture */}
            <line x1="650" y1="180" x2="295" y2="180" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />

            {/* Level 4 Horizontal: Unit <-> Class Logic */}
            <line x1="630" y1="242" x2="315" y2="242" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
          </svg>
        </div>
      )}

      {/* SVG Canvas for Black-Box Flow (Default Canvas for blackbox, system, bva, stack) */}
      {activeTab !== 'vmodel' && (
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg
            viewBox="0 0 940 220"
            className="interactive-diagram-svg"
            style={{ minHeight: '200px' }}
            role="img"
            aria-label="Black-box and system testing request-response flow diagram"
          >
            <defs>
              <marker id="arrow-sky" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* External Tester Area (Left) */}
            <g onClick={() => setSelectedFlowStep(1)} style={{ cursor: 'pointer' }}>
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
              <path d="M 80 82 C 80 75, 100 75, 100 82 M 90 68 A 5 5 0 1 0 90 78 A 5 5 0 1 0 90 68" fill="none" stroke="#38bdf8" strokeWidth="1.8" />
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
            <line x1="160" y1="90" x2="235" y2="90" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
            <line x1="160" y1="90" x2="235" y2="90" stroke="#38bdf8" strokeWidth="2.5" className="interactive-diagram-flowing-path" markerEnd="url(#arrow-sky)" />
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
              fill="rgba(15, 23, 42, 0.75)"
              stroke="#34d399"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <rect x="250" y="28" width="170" height="20" rx="4" fill="#34d39922" stroke="#34d399" strokeWidth="1" />
            <text x="335" y="42" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">
              OPAQUE SYSTEM BOUNDARY
            </text>

            {/* Subsystem 1: API Gateway & Auth */}
            <g onClick={() => setSelectedFlowStep(2)} style={{ cursor: 'pointer' }}>
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
            <line x1="360" y1="115" x2="415" y2="115" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
            <line x1="360" y1="115" x2="415" y2="115" stroke="#34d399" strokeWidth="2.5" className="interactive-diagram-flowing-path" markerEnd="url(#arrow-green)" />

            {/* Subsystem 2: Domain Microservices */}
            <g onClick={() => setSelectedFlowStep(3)} style={{ cursor: 'pointer' }}>
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
            <line x1="530" y1="115" x2="575" y2="115" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.3" />
            <line x1="530" y1="115" x2="575" y2="115" stroke="#fbbf24" strokeWidth="2.5" className="interactive-diagram-flowing-path" markerEnd="url(#arrow-amber)" />

            {/* Subsystem 3: Persistence & Kafka */}
            <g onClick={() => setSelectedFlowStep(4)} style={{ cursor: 'pointer' }}>
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
            <path d="M 685 115 C 720 115, 730 145, 755 145" fill="none" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.3" />
            <path d="M 685 115 C 720 115, 730 145, 755 145" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="interactive-diagram-flowing-path" markerEnd="url(#arrow-sky)" />
            <text x="715" y="125" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
              Outcomes
            </text>

            {/* External Verification Node (Right) */}
            <g onClick={() => setSelectedFlowStep(5)} style={{ cursor: 'pointer' }}>
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
              <path d="M 827 80 L 834 87 L 848 73" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
      )}

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

      {/* Tab 2: Equivalence Partitioning & Boundary Value Analysis */}
      {activeTab === 'bva' && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Specification Techniques: Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Testing every possible value is impossible. <strong>Equivalence Partitioning</strong> groups inputs into partitions where any value produces identical behavior. <strong>Boundary Value Analysis</strong> tests the exact transition edges $[A-1, A, A+1 \dots B-1, B, B+1]$, where 80% of boundary bugs cluster.
            </p>
          </div>

          {/* Visual Boundary Scale Strip */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>
              Input Domain Visual Partition Map (Age range: 18 to 65 allowed)
            </div>
            <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', fontSize: '11px', fontWeight: 700, textAlign: 'center', lineHeight: '28px' }}>
              <div style={{ flex: '1.2', background: 'rgba(248, 113, 113, 0.35)', color: '#fca5a5' }}>
                Invalid Low (&lt; 18)
              </div>
              <div style={{ flex: '3', background: 'rgba(52, 211, 153, 0.35)', color: '#86efac', borderLeft: '2px solid #34d399', borderRight: '2px solid #34d399' }}>
                Valid Partition [18 .. 65]
              </div>
              <div style={{ flex: '1.2', background: 'rgba(248, 113, 113, 0.35)', color: '#fca5a5' }}>
                Invalid High (&gt; 65)
              </div>
            </div>
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
              background: 'rgba(15, 23, 42, 0.75)',
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

      {/* Tab 3: V-Model Testing Hierarchy Details */}
      {activeTab === 'vmodel' && (
        <div className="blackbox-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#34d39922', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                {selectedVModelLevel.toUpperCase()} TESTING CORRESPONDENCE
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              {selectedVModelLevel === 'system' && 'System Testing validates System Requirements Specification (SRS)'}
              {selectedVModelLevel === 'unit' && 'Unit Testing validates Detailed Class Logic'}
              {selectedVModelLevel === 'integration' && 'Integration Testing validates Architecture & Interface Design'}
              {selectedVModelLevel === 'uat' && 'Acceptance Testing (UAT) validates Business Requirements'}
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {selectedVModelLevel === 'system' && (
                'System testing is the pivotal phase where all compiled artifacts, database containers, messaging clusters, and configurations are tested together as an integrated system against the SRS. It verifies both functional workflows and non-functional requirements (throughput, failover, memory leaks).'
              )}
              {selectedVModelLevel === 'unit' && (
                'Unit testing tests isolated methods and classes in memory. It uses mocks to eliminate external dependencies and completes in milliseconds, providing fast feedback during local development.'
              )}
              {selectedVModelLevel === 'integration' && (
                'Integration testing verifies the wiring between components: Spring contexts, JPA repository queries against test schemas, and WireMock external HTTP contracts.'
              )}
              {selectedVModelLevel === 'uat' && (
                'User Acceptance Testing confirms that the delivered software provides genuine business value and aligns with high-level user stories before commercial release.'
              )}
            </p>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #2dd4bf' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#2dd4bf22', color: '#2dd4bf', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                FAILURE MODES DETECTED
              </span>
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Why Unit Tests Alone Are Insufficient
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
              <li>
                <strong style={{ color: '#f87171' }}>Distributed Deadlock:</strong> Service A synchronously blocks waiting for Service B, while Service B awaits a Kafka event published by Service A.
              </li>
              <li>
                <strong style={{ color: '#fbbf24' }}>Connection Pool Saturation:</strong> HikariCP runs out of connections under concurrent production loads when upstream calls hold transactions open.
              </li>
              <li>
                <strong style={{ color: '#38bdf8' }}>Eventual Consistency Lag:</strong> Read replicas or search indexes are queried before asynchronous change data capture (CDC) completes.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: System Testing Scope (Functional + NFR) */}
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

      {/* Tab 5: Modern Black-Box Testing Stack */}
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
