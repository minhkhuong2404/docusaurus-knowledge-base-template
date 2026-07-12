import React, { useState } from 'react';

type Scenario = 'conn-failed' | 'dns-failed';

export default function TroubleshootingLayerDiagram(): React.JSX.Element {
  const [scenario, setScenario] = useState<Scenario>('conn-failed');
  const [activeStep, setActiveStep] = useState<number>(0);

  const connSteps = [
    { layer: 'Layer 1 & 2 (Link/Data)', cmd: 'ip link show / ifconfig', desc: 'Verify physical link status (UP/DOWN) and check that you have acquired a local IP address from the DHCP server.' },
    { layer: 'Layer 3 (Network IP)', cmd: 'ping 192.168.1.1\nping 8.8.8.8', desc: 'Test connectivity to the default local gateway first, and then to a known public IP address to verify routing works.' },
    { layer: 'Layer 4 (Transport Port)', cmd: 'nc -zv backend-server.internal 8080\ntelnet backend-server.internal 8080', desc: 'Query the target process port directly. Checks if the port is open and listening, or blocked by local firewalls.' },
    { layer: 'Layer 7 (Application Protocol)', cmd: 'curl -iv https://backend-server.internal/health', desc: 'Execute the raw HTTP request to inspect return codes (200, 500, 403), request headers, and content attributes.' }
  ];

  const dnsSteps = [
    { layer: 'Layer 7 (DNS Resolver)', cmd: 'nslookup api.example.com\ndig api.example.com', desc: 'Query DNS name server. Verifies if the resolver finds records or returns NXDOMAIN errors.' },
    { layer: 'Local Resolution (Hosts)', cmd: 'cat /etc/hosts', desc: 'Inspect local overrides configuration. Sometimes hardcoded mappings redirect targets to incorrect local addresses.' },
    { layer: 'Resolvers Config (DNS Server)', cmd: 'cat /etc/resolv.conf', desc: 'Validate active upstream DNS server configuration (e.g. checks if pointing to trusted servers like 8.8.8.8).' }
  ];

  const activeSteps = scenario === 'conn-failed' ? connSteps : dnsSteps;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛠️ Interactive Network Troubleshooting CLI
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setScenario('conn-failed'); setActiveStep(0); }} style={{ background: scenario === 'conn-failed' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${scenario === 'conn-failed' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: scenario === 'conn-failed' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Connection Refused</button>
          <button onClick={() => { setScenario('dns-failed'); setActiveStep(0); }} style={{ background: scenario === 'dns-failed' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${scenario === 'dns-failed' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: scenario === 'dns-failed' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>DNS Failure</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step explanation */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>
              Step {activeStep + 1}: {activeSteps[activeStep].layer}
            </span>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {activeSteps[activeStep].desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
            <button onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} disabled={activeStep === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === 0 ? '#475569' : '#e2e8f0', cursor: activeStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
            <button onClick={() => setActiveStep(prev => Math.min(activeSteps.length - 1, prev + 1))} disabled={activeStep === activeSteps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: activeStep === activeSteps.length - 1 ? '#475569' : '#e2e8f0', cursor: activeStep === activeSteps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
          </div>
        </div>

        {/* Diagnostic Command Output */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Terminal Command</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            $ {activeSteps[activeStep].cmd}
          </pre>
        </div>
      </div>
    </div>
  );
}
