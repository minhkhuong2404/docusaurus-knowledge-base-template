import React, { useState } from 'react';

export default function ProxiesNatFirewallsDiagram(): React.JSX.Element {
  const [device, setDevice] = useState<'forward' | 'reverse' | 'nat' | 'firewall'>('reverse');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Network Middleboxes: Proxies, NAT Gateway &amp; Firewalls Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setDevice('forward')} style={{ padding: '8px 4px', borderRadius: '6px', border: device === 'forward' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: device === 'forward' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Forward Proxy
          </button>
          <button onClick={() => setDevice('reverse')} style={{ padding: '8px 4px', borderRadius: '6px', border: device === 'reverse' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: device === 'reverse' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Reverse Proxy
          </button>
          <button onClick={() => setDevice('nat')} style={{ padding: '8px 4px', borderRadius: '6px', border: device === 'nat' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: device === 'nat' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            NAT (PAT Gateway)
          </button>
          <button onClick={() => setDevice('firewall')} style={{ padding: '8px 4px', borderRadius: '6px', border: device === 'firewall' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: device === 'firewall' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Stateful Firewall
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {device === 'forward' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Sits in front of CLIENTS. Hides client IP addresses, enforces corporate content filtering, and caches outbound web traffic.</p>}
          {device === 'reverse' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Sits in front of SERVERS (e.g. NGINX, HAProxy). Handles load balancing, SSL/TLS termination, rate limiting, and hides backend server IP addresses.</p>}
          {device === 'nat' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>Port Address Translation (PAT). Maps thousands of private IP addresses (`10.0.0.0/8`) to a single public IP address using distinct port numbers.</p>}
          {device === 'firewall' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>Inspects packet headers &amp; tracks TCP state tables. Drops unauthorized inbound connection attempts while allowing established outbound traffic returns.</p>}
        </div>
      </div>
    </div>
  );
}
