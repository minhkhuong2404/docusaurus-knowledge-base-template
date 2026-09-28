import React, { useState } from 'react';

export default function SidecarPatternDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Sidecar Pattern Architecture (Kubernetes Pod Linux Namespaces)
        </span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Pod Boundary */}
          <rect x="20" y="20" width="560" height="200" rx="16" fill="rgba(255,255,255,0.02)" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6,4" />
          <text x="40" y="45" fill="#a78bfa" fontSize="13" fontWeight="800" letterSpacing="0.05em">KUBERNETES POD (Shared Network &amp; Localhost 127.0.0.1)</text>

          {/* Main Application Container */}
          <g
            onMouseEnter={() => setHovered('app')}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x="50" y="70" width="200" height="120" rx="12"
                  fill={hovered === 'app' ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.1)'}
                  stroke="#38bdf8" strokeWidth={hovered === 'app' ? '2.5' : '1.5'}
                  style={{ transition: 'all 0.2s ease' }} />
            <text x="150" y="110" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="800">Primary App Container</text>
            <text x="150" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="11">Business Logic Only</text>
            <text x="150" y="152" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5" fontFamily="monospace">Java / Node.js / Go</text>
          </g>

          {/* Localhost Communication Arrows */}
          <path id="path-app-sidecar" d="M 250 120 L 345 120" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
          <path id="path-sidecar-app" d="M 350 140 L 255 140" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-blue)" className="interactive-diagram-flowing-path" />
          <text x="300" y="112" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">127.0.0.1:8080</text>

          {/* Sidecar Container */}
          <g
            onMouseEnter={() => setHovered('sidecar')}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x="350" y="70" width="200" height="120" rx="12"
                  fill={hovered === 'sidecar' ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.1)'}
                  stroke="#34d399" strokeWidth={hovered === 'sidecar' ? '2.5' : '1.5'}
                  style={{ transition: 'all 0.2s ease' }} />
            <text x="450" y="110" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="800">Sidecar Container</text>
            <text x="450" y="132" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="11">Cross-Cutting Helper</text>
            <text x="450" y="152" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5" fontFamily="monospace">Envoy / Dapr Proxy</text>
          </g>
        </svg>
      </div>

      {/* Info Card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Primary Container Responsibilities
            </div>
            <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0, paddingLeft: '16px' }}>
              <li>Pure domain &amp; business logic</li>
              <li>Lightweight codebase</li>
              <li>No duplicate security code</li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Sidecar Proxy Responsibilities
            </div>
            <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0, paddingLeft: '16px' }}>
              <li>Automatic mTLS &amp; Certificate renewal</li>
              <li>Distributed tracing header injection</li>
              <li>Retries, timeouts &amp; Circuit Breaking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
