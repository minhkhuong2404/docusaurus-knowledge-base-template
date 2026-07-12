import React, { useState } from 'react';

type Zone = 'dmz' | 'app' | 'data';

export default function NetworkSegmentationDiagram(): React.JSX.Element {
  const [activeZone, setActiveZone] = useState<Zone>('dmz');

  const zoneInfo = {
    dmz: {
      title: 'DMZ (Demilitarized Zone)',
      subnet: '10.0.1.0/24, 10.0.2.0/24',
      desc: 'Contains public-facing nodes like Load Balancers and API Gateways. Direct ingress is allowed from the internet on port 80/443. All backend applications are shielded behind this buffer zone.',
      nodes: ['Application Load Balancer', 'API Gateway (Kong/Apigee)', 'NAT Gateway']
    },
    app: {
      title: 'Application Tier (Private Subnet)',
      subnet: '10.0.10.0/24, 10.0.11.0/24',
      desc: 'Hosts core business logic, application containers, worker queues, and microservices. Absolutely no direct routes from the internet. All outbound internet traffic passes through the NAT Gateway in the DMZ.',
      nodes: ['Spring Boot App containers', 'Kubernetes Worker Nodes', 'Worker services']
    },
    data: {
      title: 'Data Tier (Most Restricted Subnet)',
      subnet: '10.0.20.0/24, 10.0.21.0/24',
      desc: 'Contains stateful storage layers, databases, caching layers, and secrets managers. This tier is completely isolated, strictly allowing inbound connections from application tier security groups only.',
      nodes: ['PostgreSQL Cluster', 'Redis Replication Groups', 'HashiCorp Vault']
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🌐 Interactive Network Segmentation & Subnet zones
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveZone('dmz')} style={{ background: activeZone === 'dmz' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeZone === 'dmz' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeZone === 'dmz' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1. DMZ</button>
          <button onClick={() => setActiveZone('app')} style={{ background: activeZone === 'app' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeZone === 'app' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeZone === 'app' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>2. App Tier</button>
          <button onClick={() => setActiveZone('data')} style={{ background: activeZone === 'data' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeZone === 'data' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeZone === 'data' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>3. Data Tier</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem' }}>
          {/* Card Info */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: activeZone === 'dmz' ? '#38bdf8' : activeZone === 'app' ? '#a78bfa' : '#4ade80' }}>
              {zoneInfo[activeZone].title}
            </h4>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '10px' }}>
              IP CIDR Range: <strong>{zoneInfo[activeZone].subnet}</strong>
            </span>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {zoneInfo[activeZone].desc}
            </p>
          </div>

          {/* Node attributes */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Deployment Targets</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {zoneInfo[activeZone].nodes.map((node, i) => (
                <div key={i} style={{ padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.72rem', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  • {node}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
