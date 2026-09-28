import React, { useState } from 'react';

type OutageMode = 'facebook' | 'kinesis' | 'stripe' | 'discord';

interface OutageCase {
  id: OutageMode;
  name: string;
  company: string;
  rootCause: string;
  blastRadius: string;
  preventionLesson: string;
  color: string;
  tag: string;
}

const OUTAGE_CASES: OutageCase[] = [
  {
    id: 'facebook',
    name: 'Facebook Oct 2021 Global Disconnection',
    company: 'Meta / Facebook',
    rootCause: 'A routine backbone network audit tool issued a command intending to evaluate capacity, but accidentally severed all connections between datacenters. Facebook authoritative DNS servers withdrew BGP routes because they could not reach backend health checks. The entire internet lost DNS resolution for facebook.com, instagram.com, and whatsapp.com.',
    blastRadius: 'Global complete outage for 6 hours; internal tools down; employees physically locked out of datacenter server rooms due to smart badge readers failing over DNS!',
    preventionLesson: 'Decouple physical security & OOB (Out-of-Band) management networks from production DNS/BGP. BGP withdrawn routes must require human confirmation if blast radius > 10% of global backbone.',
    color: '#38bdf8',
    tag: 'BGP Routing & DNS Cascading Failure',
  },
  {
    id: 'kinesis',
    name: 'AWS Kinesis Nov 2020 OS Thread Exhaustion',
    company: 'Amazon Web Services (us-east-1)',
    rootCause: 'Adding a small batch of servers to the Kinesis front-end fleet triggered an internal limit: each existing server maintained OS threads communicating with all other servers in the fleet. The expansion pushed total thread counts past the Linux kernel operating system thread limit, causing all front-end nodes to crash simultaneously in a thundering herd.',
    blastRadius: 'Cognito authentication, CloudWatch metrics, and DynamoDB Streams failed across us-east-1, impacting thousands of downstream third-party tech platforms.',
    preventionLesson: 'Never scale internal mesh topologies where connection or thread counts are O(N^2) relative to fleet size. Hard kernel ulimits must be guarded by strict capacity ceilings.',
    color: '#f87171',
    tag: 'OS Kernel Thread Limits & O(N^2) Topologies',
  },
  {
    id: 'stripe',
    name: 'Stripe Idempotency & Financial Fault Tolerance',
    company: 'Stripe Payments',
    rootCause: 'Payment requests traversing cellular networks frequently timeout while the payment was already charged downstream. Retrying without idempotency results in catastrophic double-billing of credit cards.',
    blastRadius: 'Financial double-charging, user chargebacks, card network fines.',
    preventionLesson: 'Atomic Idempotency-Key state machine: (1) Check if key exists in Redis/DB; (2) If running, wait or reject concurrent lock; (3) If committed, return cached response payload immediately without charging card again.',
    color: '#34d399',
    tag: 'Distributed Idempotency State Machine',
  },
  {
    id: 'discord',
    name: 'Discord Read States: Go to Rust Migration',
    company: 'Discord',
    rootCause: 'Discord originally wrote the Read States service (tracking which channels millions of users had read) in Go. Every 2 minutes, Go garbage collection triggered massive CPU and latency spikes: scanning 30 million in-memory cache objects forced stop-the-world GC pauses, creating 2-second tail latency spikes.',
    blastRadius: 'Degraded real-time message notification latency for 100M+ active Discord users.',
    preventionLesson: 'Replaced Go with Rust. Rust has zero garbage collection overhead: memory is freed deterministically via RAII and ownership rules, dropping latency from 2,000ms spikes down to a flat 15ms.',
    color: '#fbbf24',
    tag: 'JVM/Go GC Latency vs Rust Zero-Cost RAII',
  },
];

export default function CaseStudiesOutagesDiagram(): React.JSX.Element {
  const [selectedCase, setSelectedCase] = useState<OutageMode>('facebook');

  const activeCase = OUTAGE_CASES.find((c) => c.id === selectedCase) || OUTAGE_CASES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .outage-grid-layout {
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
          stroke="#f87171"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Production Incident Architecture & Outage Case Studies
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {OUTAGE_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCase(c.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${selectedCase === c.id ? c.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: selectedCase === c.id ? `${c.color}22` : 'transparent',
                color: selectedCase === c.id ? c.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {c.company}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="Cascading failure and root cause propagation timeline"
        >
          <defs>
            <marker
              id="arrow-red-outage"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
            <marker
              id="arrow-green-outage"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Step 1: Trigger / Configuration Change */}
          <g>
            <rect x="30" y="45" width="170" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">1</text>
            <text x="120" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Trigger Event</text>
            <text x="120" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Fleet Change / Script</text>
            <text x="120" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">Audit / Config / GC</text>
          </g>

          {/* Flow Line 1 to 2 */}
          <line x1="200" y1="90" x2="290" y2="90" stroke="#f87171" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="200"
            y1="90"
            x2="290"
            y2="90"
            stroke="#f87171"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-red-outage)"
          />

          {/* Step 2: Hidden Threshold Breach */}
          <g>
            <rect x="295" y="45" width="180" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#f87171" strokeWidth="1.5" />
            <circle cx="320" cy="72" r="14" fill="#f8717122" stroke="#f87171" strokeWidth="1.5" />
            <text x="320" y="77" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="800">2</text>
            <text x="390" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Threshold Breached</text>
            <text x="390" y="88" textAnchor="middle" fill="#f87171" fontSize="10">OS ulimit / BGP Drop</text>
            <text x="390" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">O(N^2) Connection Saturation</text>
          </g>

          {/* Flow Line 2 to 3 */}
          <line x1="475" y1="90" x2="555" y2="90" stroke="#f87171" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="475"
            y1="90"
            x2="555"
            y2="90"
            stroke="#f87171"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-red-outage)"
          />

          {/* Step 3: Cascading Failure & Circular Lock */}
          <g>
            <rect x="560" y="45" width="170" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="585" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="585" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">3</text>
            <text x="650" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Cascading Fall</text>
            <text x="650" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">DNS / Auth / Health</text>
            <text x="650" y="112" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="600">Circular Dependency</text>
          </g>

          {/* Flow Line 3 to 4 */}
          <line x1="730" y1="90" x2="790" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="730"
            y1="90"
            x2="790"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-outage)"
          />

          {/* Step 4: Resilient Recovery / Architectural Fix */}
          <g>
            <rect x="795" y="45" width="125" height="90" rx="10" fill="rgba(6, 78, 59, 0.3)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="818" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="818" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">4</text>
            <text x="860" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Hardening</text>
            <text x="860" y="88" textAnchor="middle" fill="#34d399" fontSize="9.5">OOB / Rust / Idemp</text>
            <text x="860" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Air-Gapped</text>
          </g>
        </svg>
      </div>

      {/* Details Split Pane */}
      <div className="outage-grid-layout" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', marginTop: '16px' }}>
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${activeCase.color}` }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: activeCase.color, textTransform: 'uppercase' }}>
            {activeCase.tag}
          </span>
          <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            {activeCase.name}
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {activeCase.rootCause}
          </p>
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.25)', marginBottom: '8px' }}>
            <strong style={{ fontSize: '11.5px', color: '#f87171', display: 'block', marginBottom: '2px' }}>
              Blast Radius:
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              {activeCase.blastRadius}
            </span>
          </div>
        </div>

        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
            SENIOR ARCHITECTURAL TAKEAWAY
          </span>
          <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            How to Prevent This in Your Systems
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            {activeCase.preventionLesson}
          </p>
        </div>
      </div>
    </div>
  );
}
