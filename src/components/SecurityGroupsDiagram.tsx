import React, { useState } from 'react';

type Resource = 'app' | 'db' | 'bastion';

export default function SecurityGroupsDiagram(): React.JSX.Element {
  const [activeRes, setActiveRes] = useState<Resource>('app');

  const ruleSet = {
    app: {
      name: 'Application Server Security Group (sg-appserver)',
      inbound: [
        { port: 'HTTPS (443)', source: 'sg-loadbalancer (ALB SG only)', reason: 'Allows traffic from the load balancer.' },
        { port: 'SSH (22)', source: 'sg-bastion (Bastion Host SG only)', reason: 'Allows secure developer debugging.' }
      ],
      outbound: [
        { port: 'PostgreSQL (5432)', dest: 'sg-database', reason: 'Access to relational database.' },
        { port: 'HTTPS (443)', dest: '0.0.0.0/0 (Internet)', reason: 'Third-party API integrations / packages.' }
      ]
    },
    db: {
      name: 'Database Security Group (sg-database)',
      inbound: [
        { port: 'PostgreSQL (5432)', source: 'sg-appserver (Application Server only)', reason: 'Restricts query executions strictly to app containers.' }
      ],
      outbound: [
        { port: 'All Ports', dest: 'None (Default Outbound Blocked)', reason: 'Strict isolate: database is prohibited from initiating network calls.' }
      ]
    },
    bastion: {
      name: 'Bastion Host Security Group (sg-bastion)',
      inbound: [
        { port: 'SSH (22)', source: 'Specific corporate Office IP / VPN Gateway', reason: 'Access restricted to staff networks only.' }
      ],
      outbound: [
        { port: 'SSH (22)', dest: 'sg-appserver / sg-database', reason: 'Tunnel connections into private resources.' }
      ]
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ Stateful Security Groups (Default Deny Rules)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveRes('app')} style={{ background: activeRes === 'app' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRes === 'app' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRes === 'app' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>App Server</button>
          <button onClick={() => setActiveRes('db')} style={{ background: activeRes === 'db' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRes === 'db' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRes === 'db' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Database</button>
          <button onClick={() => setActiveRes('bastion')} style={{ background: activeRes === 'bastion' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRes === 'bastion' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRes === 'bastion' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Bastion Host</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{ruleSet[activeRes].name}</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Inbound */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px' }}>
            <h5 style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: '#4ade80' }}>📥 Inbound Allowed (Ingress)</h5>
            {ruleSet[activeRes].inbound.map((rule, idx) => (
              <div key={idx} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.72rem' }}>
                <div style={{ fontFamily: 'monospace', color: '#e2e8f0' }}><strong>Port:</strong> {rule.port}</div>
                <div style={{ fontFamily: 'monospace', color: '#94a3b8' }}><strong>Source:</strong> {rule.source}</div>
                <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '2px' }}>{rule.reason}</div>
              </div>
            ))}
          </div>

          {/* Outbound */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px' }}>
            <h5 style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: '#fb923c' }}>📤 Outbound Allowed (Egress)</h5>
            {ruleSet[activeRes].outbound.map((rule, idx) => (
              <div key={idx} style={{ marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.72rem' }}>
                <div style={{ fontFamily: 'monospace', color: '#e2e8f0' }}><strong>Port:</strong> {rule.port}</div>
                <div style={{ fontFamily: 'monospace', color: '#94a3b8' }}><strong>Destination:</strong> {'dest' in rule ? rule.dest : 'None'}</div>
                <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '2px' }}>{rule.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Stateful Rule Behavior: If a security group allows an inbound connection, response traffic is automatically allowed outbound, regardless of outbound rules.</p>
    </div>
  );
}
