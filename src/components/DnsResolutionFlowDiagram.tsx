import React, { useState } from 'react';

export default function DnsResolutionFlowDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Recursive DNS Resolution Step-by-Step Simulator (`example.com`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {[1, 2, 3, 4].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: step === s ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: step === s ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              Step {s}: {s === 1 ? 'Browser/OS Cache' : s === 2 ? 'Root Server (.)' : s === 3 ? '.com TLD Server' : 'Authoritative NS'}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {step === 1 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 1: Check browser cache, OS `/etc/hosts`, local DNS resolver cache (e.g. 1.1.1.1 or 8.8.8.8). On cache miss, recursive query starts.</p>}
          {step === 2 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 2: Recursive resolver queries Root DNS Server (`.`). Root server responds with NS referral to `.com` Top-Level Domain (TLD) servers.</p>}
          {step === 3 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 3: Recursive resolver queries `.com` TLD Server. TLD server responds with NS referral pointing to `example.com` Authoritative Nameservers.</p>}
          {step === 4 && <p style={{ margin: 0, fontSize: '12.5px', color: '#34d399', fontWeight: 700 }}>Step 4: Recursive resolver queries Authoritative NS. Authoritative server returns final A Record `93.184.216.34` with TTL 3600. Cached and returned to client!</p>}
        </div>
      </div>
    </div>
  );
}
