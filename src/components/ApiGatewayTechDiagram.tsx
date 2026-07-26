import React, { useState } from 'react';

interface GatewayTech {
  id: string;
  name: string;
  badge: string;
  color: string;
  runtime: string;
  extensibility: string;
  performance: string;
  useCase: string;
  features: string[];
}

const GATEWAYS: GatewayTech[] = [
  {
    id: 'spring',
    name: 'Spring Cloud Gateway',
    badge: 'Java / Netty',
    color: '#34d399',
    runtime: 'Reactive Netty / Project Reactor',
    extensibility: 'Java Filters, Custom Predicates, Spring Beans',
    performance: 'High throughput, non-blocking I/O',
    useCase: 'Enterprise Spring Boot microservices ecosystem requiring deep Spring integration.',
    features: ['CircuitBreaker (Resilience4j) integration', 'Redis RateLimiter filter', 'Path/Header route predicates', 'Eureka/K8s service discovery integration'],
  },
  {
    id: 'kong',
    name: 'Kong API Gateway',
    badge: 'OpenResty / Lua',
    color: '#38bdf8',
    runtime: 'Nginx + OpenResty (Lua JIT)',
    extensibility: 'Lua plugins, Go plugins, JS/Python PDK',
    performance: 'Ultra-low latency sub-millisecond overhead',
    useCase: 'High-scale multi-language API management requiring rich plugin marketplace.',
    features: ['OAuth2 / OIDC authentication', 'Rate limiting & IP restriction', 'gRPC / GraphQL proxying', 'Declarative DB-less configuration'],
  },
  {
    id: 'aws',
    name: 'AWS API Gateway',
    badge: 'Serverless / Cloud',
    color: '#fbbf24',
    runtime: 'AWS Fully Managed Edge Service',
    extensibility: 'Lambda Authorizers, OpenAPI specs',
    performance: 'Auto-scaling managed by AWS infrastructure',
    useCase: 'Serverless architectures built on AWS Lambda, DynamoDB, and IAM.',
    features: ['Native AWS IAM authentication', 'Usage plans & API key keys', 'REST & WebSocket API support', 'CloudWatch metrics & logging'],
  },
  {
    id: 'nginx',
    name: 'NGINX / Traefik',
    badge: 'Reverse Proxy',
    color: '#a78bfa',
    runtime: 'C (NGINX) / Go (Traefik)',
    extensibility: 'Dynamic configuration, Middleware chains',
    performance: 'Industry standard max performance',
    useCase: 'Cloud-native Kubernetes ingress controller and edge routing.',
    features: ['Automatic TLS (Let\'s Encrypt)', 'Kubernetes CRD integration', 'HTTP/2 & HTTP/3 (QUIC)', 'Circuit breaking & health checks'],
  },
];

export default function ApiGatewayTechDiagram() {
  const [activeGateway, setActiveGateway] = useState<string>('spring');

  const current = GATEWAYS.find(g => g.id === activeGateway) || GATEWAYS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>API Gateway Architecture &amp; Technology Explorer</span>
      </div>

      {/* Top Routing Topology Preview */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Unified Edge Routing Flow
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Clients</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Mobile / Web / Partner</div>
          </div>
          <div style={{ color: '#38bdf8', fontSize: '16px' }}>→</div>
          <div style={{ background: `${current.color}20`, border: `1.5px solid ${current.color}`, padding: '10px 16px', borderRadius: '10px', textAlign: 'center', boxShadow: `0 0 12px ${current.color}30` }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: current.color }}>{current.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Auth · Rate Limit · Route · TLS</div>
          </div>
          <div style={{ color: current.color, fontSize: '16px' }}>→</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#34d399', fontWeight: 600 }}>User Svc</div>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>Order Svc</div>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#a78bfa', fontWeight: 600 }}>Pay Svc</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {GATEWAYS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGateway(g.id)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: activeGateway === g.id ? `${g.color}20` : 'rgba(255,255,255,0.04)',
              color: activeGateway === g.id ? g.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeGateway === g.id ? `0 0 0 1.5px ${g.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${current.color}40`, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: current.color }}>{current.name}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: `${current.color}20`, color: current.color, border: `1px solid ${current.color}40` }}>
            {current.badge}
          </span>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.useCase}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Runtime Engine</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600, marginTop: '2px' }}>{current.runtime}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Extensibility</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600, marginTop: '2px' }}>{current.extensibility}</div>
          </div>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Key Capabilities
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {current.features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ifm-color-content)', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px' }}>
              <span style={{ color: current.color }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
