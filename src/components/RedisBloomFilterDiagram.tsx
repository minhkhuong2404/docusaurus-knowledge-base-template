import React, { useState } from 'react';

export default function RedisBloomFilterDiagram(): React.JSX.Element {
  const [testEmail, setTestEmail] = useState<string>('alice@example.com');

  const addedEmails = ['alice@example.com', 'bob@example.com', 'carol@example.com'];
  const isAdded = addedEmails.includes(testEmail.trim().toLowerCase());

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          RedisBloom Filter Probabilistic Pre-Filter Inspector (`BF.EXISTS`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
            Test Email Membership in Bloom Filter:
          </label>
          <input
            type="text"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: '#05070e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          />
        </div>

        {/* Added Items Pre-Loaded */}
        <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
          Pre-populated emails in filter: <code>alice@example.com</code>, <code>bob@example.com</code>, <code>carol@example.com</code>
        </div>

        {/* Filter Outcome */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            backgroundColor: isAdded ? 'rgba(167, 139, 250, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: isAdded ? '1px solid #a78bfa' : '1px solid #38bdf8',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
            BF.EXISTS Response
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: isAdded ? '#a78bfa' : '#38bdf8', marginTop: '2px' }}>
            {isAdded ? '1 ➔ PROBABLY EXISTS (Check Database to Confirm)' : '0 ➔ DEFINITELY DOES NOT EXIST (0% False Negative Guarantee)'}
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
            {isAdded ? (
              <span>All 7 hash function bit positions evaluate to <code>1</code>. Proceed to SQL Database query to confirm or handle false positive.</span>
            ) : (
              <span>At least 1 hash position returned <code>0</code>. Database lookup skipped entirely! (Saves DB load).</span>
            )}
          </p>
        </div>

        {/* Command Output */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.05)' }}>
          BF.EXISTS registered_emails "{testEmail}" -&gt; {isAdded ? 1 : 0}
        </div>
      </div>
    </div>
  );
}
