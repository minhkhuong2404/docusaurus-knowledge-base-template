import React, { useState } from 'react';

type Model = 'vpn' | 'ztna';

export default function ZeroTrustDiagram(): React.JSX.Element {
  const [model, setModel] = useState<Model>('vpn');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ Perimeter VPN vs. Zero Trust Network Access (ZTNA)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setModel('vpn')} style={{ background: model === 'vpn' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${model === 'vpn' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: model === 'vpn' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Traditional VPN</button>
          <button onClick={() => setModel('ztna')} style={{ background: model === 'ztna' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${model === 'ztna' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: model === 'ztna' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Zero Trust ZTNA ✅</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Scenario description */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          {model === 'vpn' ? (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#f87171' }}>Castle-and-Moat Model (VPN)</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Assumes everything inside the network is safe. The employee logs in once through a VPN client. Once authenticated, they have lateral access to all servers, logs, and databases in the corporate network.
              </p>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>Verify Globally, Trust None (ZTNA)</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Does not rely on physical or virtual networks for boundaries. Every attempt to access a specific resource is authenticated, checked for device posture compliance, and restricted strictly to that specific host using least-privilege.
              </p>
            </>
          )}
        </div>

        {/* Action checks list */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Access Policy Checks</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {model === 'vpn' ? (
              <>
                <div style={{ textDecoration: 'line-through', color: '#64748b', fontSize: '0.72rem' }}>• Authenticate on every connection</div>
                <div style={{ textDecoration: 'line-through', color: '#64748b', fontSize: '0.72rem' }}>• Inspect device MDM posture</div>
                <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 700 }}>• ✅ Ingress VPN session (Access All)</div>
              </>
            ) : (
              <>
                <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 700 }}>• ✅ Verify user identity (MFA check)</div>
                <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 700 }}>• ✅ Scan device health (posture scan)</div>
                <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 700 }}>• ✅ Restrict to target app (least-privilege)</div>
                <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 700 }}>• ✅ Continuous trust re-evaluations</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
