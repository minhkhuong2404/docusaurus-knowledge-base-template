import React, { useState } from 'react';

interface XdsService {
  name: string;
  code: string;
  color: string;
  role: string;
  details: string;
}

const XDS_SERVICES: XdsService[] = [
  {
    name: 'Listener Discovery Service',
    code: 'LDS',
    color: '#38bdf8',
    role: 'Port & IP Ingress Binding',
    details: 'Dynamically opens and binds network sockets (e.g. 0.0.0.0:443 or :10000) for incoming client traffic.'
  },
  {
    name: 'Route Discovery Service',
    code: 'RDS',
    color: '#34d399',
    role: 'HTTP Routing & Matching',
    details: 'Configures virtual hosts, prefix/regex URL matching, header routing, redirects, and retries.'
  },
  {
    name: 'Cluster Discovery Service',
    code: 'CDS',
    color: '#fbbf24',
    role: 'Upstream Grouping',
    details: 'Defines upstream server pools (e.g. payment-service-cluster), TLS client certificates, and load balancing algorithms.'
  },
  {
    name: 'Endpoint Discovery Service',
    code: 'EDS',
    color: '#a78bfa',
    role: 'Dynamic Pod / Container IPs',
    details: 'Streams the live member IPs and port health statuses for backend pods in real-time as Kubernetes scales pods.'
  }
];

export default function EnvoyProxyDiagram(): React.JSX.Element {
  const [selectedXds, setSelectedXds] = useState<XdsService>(XDS_SERVICES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Envoy Data Plane & Dynamic xDS Control Plane
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* SVG Pipeline */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
              </marker>
              <marker id="arr-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
              </marker>
              <marker id="arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Top: Control Plane (Istio / xDS) */}
            <g transform="translate(180, 10)">
              <rect x="0" y="0" width="440" height="42" rx="6" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="220" y="25" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="700">
                ☸️ CONTROL PLANE (Istio Pilot / Custom xDS Server)
              </text>
            </g>

            {/* xDS Streaming Downward Arrows */}
            <path d="M 400 54 L 400 80" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arr-purple)" className="interactive-diagram-flowing-path" />
            <text x="410" y="70" fill="#a78bfa" fontSize="9" fontWeight="700">xDS gRPC Streaming (0-Downtime Updates)</text>

            {/* Main Envoy Data Plane Container */}
            <rect x="20" y="85" width="760" height="145" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="35" y="105" fill="#38bdf8" fontSize="11" fontWeight="800">ENVOY DATA PLANE (High-Performance C++ Proxy)</text>

            {/* Step 1: Listeners */}
            <g transform="translate(40, 115)">
              <rect x="0" y="0" width="140" height="95" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" />
              <text x="12" y="22" fill="#38bdf8" fontSize="11" fontWeight="700">1. Listeners (LDS)</text>
              <text x="12" y="42" fill="#cbd5e1" fontSize="9.5">TCP Socket :443</text>
              <text x="12" y="58" fill="#94a3b8" fontSize="8.5">Downstream TLS Term.</text>
              <text x="12" y="74" fill="#64748b" fontSize="8">Worker Thread Accept</text>
            </g>

            {/* Flow 1 -> 2 */}
            <path d="M 182 160 L 225 160" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" className="interactive-diagram-flowing-path" />

            {/* Step 2: L7 Filters & Routes */}
            <g transform="translate(230, 115)">
              <rect x="0" y="0" width="160" height="95" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" />
              <text x="12" y="22" fill="#34d399" fontSize="11" fontWeight="700">2. Filters & Routes (RDS)</text>
              <text x="12" y="42" fill="#cbd5e1" fontSize="9.5">HTTP Connection Mgr</text>
              <text x="12" y="58" fill="#94a3b8" fontSize="8.5">Rate Limiting • JWT Auth</text>
              <text x="12" y="74" fill="#64748b" fontSize="8">VirtualHost Path Routing</text>
            </g>

            {/* Flow 2 -> 3 */}
            <path d="M 392 160 L 435 160" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arr-green)" className="interactive-diagram-flowing-path" />

            {/* Step 3: Cluster Manager */}
            <g transform="translate(440, 115)">
              <rect x="0" y="0" width="150" height="95" rx="6" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" />
              <text x="12" y="22" fill="#fbbf24" fontSize="11" fontWeight="700">3. Cluster Mgr (CDS)</text>
              <text x="12" y="42" fill="#cbd5e1" fontSize="9.5">Upstream Service Pool</text>
              <text x="12" y="58" fill="#94a3b8" fontSize="8.5">Load Balancing Algorithm</text>
              <text x="12" y="74" fill="#64748b" fontSize="8">Circuit Breaking • Retries</text>
            </g>

            {/* Flow 3 -> 4 */}
            <path d="M 592 160 L 630 160" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-green)" className="interactive-diagram-flowing-path" />

            {/* Step 4: Endpoints */}
            <g transform="translate(635, 115)">
              <rect x="0" y="0" width="130" height="95" rx="6" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" />
              <text x="10" y="22" fill="#a78bfa" fontSize="11" fontWeight="700">4. Endpoints (EDS)</text>
              <text x="10" y="42" fill="#cbd5e1" fontSize="9.5">Pod IPs & Health</text>
              <text x="10" y="58" fill="#94a3b8" fontSize="8.5">10.244.1.4:8080</text>
              <text x="10" y="74" fill="#64748b" fontSize="8">Active Health Checks</text>
            </g>
          </svg>
        </div>

        {/* Interactive xDS Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {XDS_SERVICES.map(srv => (
            <button
              key={srv.code}
              onClick={() => setSelectedXds(srv)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${selectedXds.code === srv.code ? srv.color : 'rgba(255,255,255,0.1)'}`,
                background: selectedXds.code === srv.code ? `${srv.color}20` : 'rgba(255,255,255,0.03)',
                color: selectedXds.code === srv.code ? srv.color : 'var(--ifm-color-content-secondary)',
                fontWeight: selectedXds.code === srv.code ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {srv.code} — {srv.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Selected Service Card */}
        <div style={{ padding: '12px 16px', background: `${selectedXds.color}0c`, border: `1px solid ${selectedXds.color}35`, borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: selectedXds.color }}>
              {selectedXds.code}: {selectedXds.name}
            </span>
            <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', background: `${selectedXds.color}20`, color: selectedXds.color, fontWeight: 600 }}>
              {selectedXds.role}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedXds.details}
          </div>
        </div>
      </div>
    </div>
  );
}
