import React, { useState } from 'react';

interface SessionPattern {
  id: string;
  name: string;
  badge: string;
  color: string;
  architecture: string;
  failoverBehavior: string;
  springIntegration: string;
  pros: string[];
  cons: string[];
}

const PATTERNS: SessionPattern[] = [
  {
    id: 'sticky',
    name: '1. Sticky Sessions (Session Affinity)',
    badge: 'Stateful Server Memory',
    color: '#f87171',
    architecture: 'Load balancer pins user requests to Server A based on cookie hash. Session data stored in Server A local RAM.',
    failoverBehavior: 'If Server A crashes or auto-scales down, ALL user sessions on Server A are permanently LOST! Users must log in again.',
    springIntegration: 'Default Tomcat `HttpSession` in local JVM heap.',
    pros: [
      'Fast local RAM access (zero network hop for session lookup)',
      'Simple single-server setup',
    ],
    cons: [
      'High risk of user session loss on server deployment or crash',
      'Uneven load distribution across server cluster',
    ],
  },
  {
    id: 'redis-store',
    name: '2. Centralized Redis Session Store (Stateless App Servers)',
    badge: 'Stateless Production Standard',
    color: '#34d399',
    architecture: 'App servers are 100% stateless. Every request pulls/updates session state from a high-speed central Redis Cluster.',
    failoverBehavior: 'If Server A crashes, Load Balancer routes user to Server B. Server B instantly reads session from Redis — zero user disruption!',
    springIntegration: '`@EnableRedisHttpSession` with `Spring Session Redis` dependency.',
    pros: [
      '100% Zero session loss on app server deployments or restarts',
      'Enables true horizontal auto-scaling (add/remove app pods freely)',
    ],
    cons: [
      'Requires ~1ms network round-trip to Redis per HTTP request',
      'Requires managing a highly available Redis Cluster',
    ],
  },
];

export default function RedisSessionManagementDiagram(): React.JSX.Element {
  const [selectedPattern, setSelectedPattern] = useState<SessionPattern>(PATTERNS[1]); // Default to Centralized Redis

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Distributed Session Architecture: Sticky Sessions vs Centralized Redis Store
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Pattern Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {PATTERNS.map((p) => {
            const isSelected = p.id === selectedPattern.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPattern(p)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${p.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12.5px',
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Selected Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedPattern.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedPattern.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedPattern.color}22`, color: selectedPattern.color, fontWeight: 700 }}>
              {selectedPattern.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedPattern.architecture}
          </p>
        </div>

        {/* Technical Comparisons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Server Node Failover Impact
            </div>
            <div style={{ fontSize: '12.5px', color: selectedPattern.color, fontWeight: 600, marginBottom: '10px', lineHeight: 1.4 }}>
              {selectedPattern.failoverBehavior}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Spring Boot Framework Integration
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>
              {selectedPattern.springIntegration}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Architectural Trade-offs
            </div>
            <div style={{ fontSize: '12px', color: '#34d399', marginBottom: '6px' }}>
              <strong>Pros:</strong> {selectedPattern.pros.join(' • ')}
            </div>
            <div style={{ fontSize: '12px', color: '#f87171' }}>
              <strong>Cons:</strong> {selectedPattern.cons.join(' • ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
