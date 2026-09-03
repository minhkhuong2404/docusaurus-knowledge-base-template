import React, { useState } from 'react';

export default function ServiceDiscoveryDiagram(): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<'client_side' | 'server_side'>('client_side');
  const [step, setStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Dynamic Service Discovery Architecture & Handshake
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'client_side', label: 'Client-Side (Eureka / Consul)', color: '#38bdf8' },
            { id: 'server_side', label: 'Server-Side (K8s DNS / Envoy)', color: '#34d399' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeMode === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
                background: activeMode === m.id ? `${m.color}20` : 'rgba(255,255,255,0.04)',
                color: activeMode === m.id ? m.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeMode === m.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* SVG Topology */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 800 230" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="sd-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
              </marker>
              <marker id="sd-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
              <marker id="sd-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Top Node: Service Registry */}
            <g transform="translate(300, 15)">
              <rect x="0" y="0" width="220" height="60" rx="8" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="110" y="26" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="700">
                {activeMode === 'client_side' ? '📦 Eureka / Consul Registry' : '☸️ CoreDNS & K8s Registry'}
              </text>
              <text x="110" y="44" textAnchor="middle" fill="#94a3b8" fontSize="9.5">
                {activeMode === 'client_side' ? 'Stores Ephemeral Pod IPs & Heartbeats' : 'Stores ClusterIP & Pod Endpoints'}
              </text>
            </g>

            {/* Left Node: Client / API Gateway */}
            <g transform="translate(40, 130)">
              <rect x="0" y="0" width="200" height="75" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="14" y="24" fill="#38bdf8" fontSize="12" fontWeight="700">API Gateway / Client</text>
              <text x="14" y="44" fill="#cbd5e1" fontSize="9.5">Wants: lb://order-service</text>
              <text x="14" y="60" fill="#94a3b8" fontSize="8.5">
                {activeMode === 'client_side' ? 'Client LoadBalancer (Round Robin)' : 'Sends plain HTTP to DNS name'}
              </text>
            </g>

            {/* Right Node: Target Service Instance */}
            <g transform="translate(560, 130)">
              <rect x="0" y="0" width="200" height="75" rx="8" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1.5" />
              <text x="14" y="24" fill="#34d399" fontSize="12" fontWeight="700">order-service (Instance 1)</text>
              <text x="14" y="44" fill="#cbd5e1" fontSize="9.5">IP: 10.0.1.5:8080</text>
              <text x="14" y="60" fill="#86efac" fontSize="8.5">Status: UP (30s Heartbeat OK)</text>
            </g>

            {/* Path 1: Target -> Registry (Registration / Heartbeat) */}
            <path d="M 640 128 L 520 70" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#sd-arr-purple)" className="interactive-diagram-flowing-path" />
            <text x="610" y="90" fill="#a78bfa" fontSize="8.5" fontWeight="700">1. Heartbeat / Register (IP: 10.0.1.5)</text>

            {/* Path 2: Client <-> Registry (Lookup) */}
            <path d="M 160 128 L 298 68" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#sd-arr-blue)" className="interactive-diagram-flowing-path" />
            <text x="120" y="90" fill="#38bdf8" fontSize="8.5" fontWeight="700">2. Query 'order-service'</text>

            {/* Path 3: Direct Route Call (Client -> Target) */}
            <path d="M 245 168 L 552 168" fill="none" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#sd-arr-green)" className="interactive-diagram-flowing-path" />
            <text x="320" y="160" fill="#34d399" fontSize="9.5" fontWeight="700">3. Direct Routed HTTP Call (10.0.1.5:8080)</text>
          </svg>
        </div>

        {/* Breakdown Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '6px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <strong style={{ color: '#a78bfa', fontSize: '11px' }}>1. Dynamic Registration:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              When a new container spins up, it registers its IP and port with the registry. It sends a heartbeat every 30s. If heartbeats fail, the registry evicts the node.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <strong style={{ color: '#38bdf8', fontSize: '11px' }}>2. Instance Resolution:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              The client queries the registry for the logical service name (<code>order-service</code>) and caches the returned list of healthy IP addresses locally.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <strong style={{ color: '#34d399', fontSize: '11px' }}>3. Point-to-Point Execution:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Traffic does NOT flow through the registry. The client establishes a direct socket connection to <code>10.0.1.5:8080</code>, avoiding registry bottlenecks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
