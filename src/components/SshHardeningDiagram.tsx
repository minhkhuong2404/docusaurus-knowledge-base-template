import React, { useState } from 'react';

type ConfigRule = 'root' | 'pass' | 'tries' | 'ciphers';

export default function SshHardeningDiagram(): React.JSX.Element {
  const [activeRule, setActiveRule] = useState<ConfigRule>('root');

  const configs = {
    root: {
      line: 'PermitRootLogin no',
      desc: 'Disables direct root access over SSH. Attackers brute-forcing ssh configurations always target the "root" username first. Forcing users to login as an unprivileged service account first blocks these automatic brute-force scripts.'
    },
    pass: {
      line: 'PasswordAuthentication no',
      desc: 'Disables standard password-based login. All access must use authorized SSH key pairs (asymmetric keys). This completely prevents dictionary and dictionary-based credential stuffing attacks.'
    },
    tries: {
      line: 'MaxAuthTries 3',
      desc: 'Limits the maximum number of failed authentication attempts per session to 3. If exceeded, the daemon instantly drops the socket connection, slowing down aggressive brute-force engines.'
    },
    ciphers: {
      line: 'Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com',
      desc: 'Disables legacy and weak encryption algorithms (like 3DES or CBC mode ciphers) which are vulnerable to collision attacks, forcing the use of modern, secure AEAD ciphers.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ SSH Config Hardening Guide
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveRule('root')} style={{ background: activeRule === 'root' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRule === 'root' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRule === 'root' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Disable Root</button>
          <button onClick={() => setActiveRule('pass')} style={{ background: activeRule === 'pass' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRule === 'pass' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRule === 'pass' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Disable Passwords</button>
          <button onClick={() => setActiveRule('tries')} style={{ background: activeRule === 'tries' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRule === 'tries' ? '#fb923c' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRule === 'tries' ? '#fb923c' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Max Tries</button>
          <button onClick={() => setActiveRule('ciphers')} style={{ background: activeRule === 'ciphers' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRule === 'ciphers' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeRule === 'ciphers' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Ciphers</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Description box */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Configuration Rationale</h4>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {configs[activeRule].desc}
          </p>
        </div>

        {/* Configuration Line */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>sshd_config directive</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {configs[activeRule].line}
          </pre>
        </div>
      </div>
    </div>
  );
}
