import React, { useState } from 'react';

type Tab = 'dnssec' | 'rebinding';

export default function DnsSecurityDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('dnssec');
  const [rebindStep, setRebindStep] = useState<number>(0);

  const rebindingSteps = [
    {
      title: '1. Visit Attacker Page',
      desc: 'Victim visits "attacker.com" resolving to the attacker\'s server IP (e.g. 203.0.113.5). The page loads malicious JavaScript.'
    },
    {
      title: '2. Short TTL expires & Rebind',
      desc: 'The DNS record for "attacker.com" has a TTL of 0. The attacker changes the DNS configuration to point to "192.168.1.1" (the victim\'s local home router).'
    },
    {
      title: '3. SOP Bypass & Access Router',
      desc: 'Malicious JavaScript executes request to "attacker.com/admin/settings". Because the domain matches, the browser\'s Same-Origin Policy (SOP) allows the connection, sending requests to the victim\'s local router.'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🌐 Interactive DNS Security & Rebinding Exploit
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveTab('dnssec')} style={{ background: activeTab === 'dnssec' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'dnssec' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'dnssec' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>DNSSEC</button>
          <button onClick={() => setActiveTab('rebinding')} style={{ background: activeTab === 'rebinding' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'rebinding' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'rebinding' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>DNS Rebinding Attack</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {activeTab === 'dnssec' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Unverified */}
            <div style={{ background: 'rgba(248,113,113,0.02)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, padding: '1rem' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f87171' }}>Standard DNS (No Verification)</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Query resolves to IP directly without cryptographic checks. Attacker can poison resolver caches, pointing users to malicious mirror servers.
              </p>
              <pre style={{ margin: 0, padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#f87171' }}>
{`Query: api.example.com
Result IP: 185.190.140.15
Signature: NONE ❌`}
              </pre>
            </div>

            {/* DNSSEC */}
            <div style={{ background: 'rgba(74,222,128,0.02)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '1rem' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>DNSSEC (Cryptographically Signed)</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Zone registers are cryptographically signed using public keys. Resolvers verify signatures, completely preventing spoofing and poisoning.
              </p>
              <pre style={{ margin: 0, padding: '6px 10px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#4ade80' }}>
{`Query: api.example.com
Result IP: 185.190.140.15
Signature: a9f83... (Verified) ✅`}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            {/* Left walk */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{rebindingSteps[rebindStep].title}</h4>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                  {rebindingSteps[rebindStep].desc}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: '12px' }}>
                <button onClick={() => setRebindStep(prev => Math.max(0, prev - 1))} disabled={rebindStep === 0} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: rebindStep === 0 ? '#475569' : '#e2e8f0', cursor: rebindStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Back</button>
                <button onClick={() => setRebindStep(prev => Math.min(rebindingSteps.length - 1, prev + 1))} disabled={rebindStep === rebindingSteps.length - 1} style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: rebindStep === rebindingSteps.length - 1 ? '#475569' : '#e2e8f0', cursor: rebindStep === rebindingSteps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem' }}>Next</button>
              </div>
            </div>

            {/* DNS State */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Active DNS Mapping</h4>
              <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8' }}>
                {rebindStep === 0 ? (
`attacker.com → 203.0.113.5 (TTL=0)
JavaScript: fetch("/settings")`
                ) : rebindStep === 1 ? (
`attacker.com → 192.168.1.1 (TTL=0)
DNS Cache: Expired!`
                ) : (
`attacker.com → 192.168.1.1
Request targets local router!
Bypasses SOP! 🚨`
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
